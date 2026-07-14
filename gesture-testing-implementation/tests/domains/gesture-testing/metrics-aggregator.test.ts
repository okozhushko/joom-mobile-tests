/**
 * Tests for Metrics Aggregator
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  MetricsAggregator,
  StatisticalAnalyzer,
  mean,
  median,
  standardDeviation,
  type StatisticalSummary,
} from '@domains/gesture-testing';
import { COMMON_DEVICE_PROFILES } from '@domains/gesture-testing/device-profile';
import type { GestureTimingMetrics } from '@domains/gesture-testing/gesture-timing-validator';

describe('StatisticalAnalyzer', () => {
  let analyzer: StatisticalAnalyzer;

  beforeEach(() => {
    analyzer = new StatisticalAnalyzer();
  });

  describe('Basic Statistics', () => {
    it('should calculate mean, median, and stdDev', () => {
      const values = [85, 90, 88, 92, 87, 89, 91];
      const summary = analyzer.analyze(values);

      expect(summary.count).toBe(7);
      expect(summary.min).toBe(85);
      expect(summary.max).toBe(92);
      expect(summary.mean).toBeCloseTo(88.86, 0);
      expect(summary.median).toBe(89);
      expect(summary.stdDev).toBeGreaterThan(0);
    });

    it('should calculate percentiles correctly', () => {
      const values = Array.from({ length: 100 }, (_, i) => i + 1);
      const summary = analyzer.analyze(values);

      // Percentiles should be close to expected values (linear interpolation)
      expect(summary.p25).toBeGreaterThan(24);
      expect(summary.p25).toBeLessThan(27);
      expect(summary.p50).toBeGreaterThan(49);
      expect(summary.p50).toBeLessThan(51);
      expect(summary.p75).toBeGreaterThan(74);
      expect(summary.p75).toBeLessThan(76);
      expect(summary.p95).toBeGreaterThan(94);
      expect(summary.p95).toBeLessThan(96);
      expect(summary.p99).toBeGreaterThan(98);
      expect(summary.p99).toBeLessThan(101);
    });

    it('should handle single value', () => {
      const values = [42];
      const summary = analyzer.analyze(values);

      expect(summary.count).toBe(1);
      expect(summary.mean).toBe(42);
      expect(summary.median).toBe(42);
      expect(summary.stdDev).toBe(0);
    });
  });

  describe('Outlier Detection', () => {
    it('should detect outliers using IQR method', () => {
      // Normal distribution with outliers
      const values = [85, 87, 88, 89, 90, 91, 92, 94, 150]; // 150 is outlier
      const summary = analyzer.analyze(values);

      expect(summary.outlierCount).toBeGreaterThan(0);
      expect(summary.outliersHigh).toContain(150);
    });

    it('should return no outliers for normal data', () => {
      const values = [85, 86, 87, 88, 89, 90, 91, 92, 93];
      const summary = analyzer.analyze(values);

      expect(summary.outlierCount).toBe(0);
    });

    it('should remove outliers correctly', () => {
      const values = [10, 85, 87, 88, 89, 90, 91, 92, 200];
      const { cleaned, removed } = analyzer.removeOutliers(values);

      expect(cleaned.length).toBeLessThan(values.length);
      expect(removed.length).toBeGreaterThan(0);
      // All cleaned values should be within reasonable range
      expect(cleaned.every(v => v > 50 && v < 150)).toBe(true);
    });
  });

  describe('Distribution Analysis', () => {
    it('should identify normal distribution', () => {
      const values = Array.from({ length: 1000 }, () => {
        // Box-Muller transform for normal distribution
        const u1 = Math.random();
        const u2 = Math.random();
        return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * 10 + 90;
      });

      const dist = analyzer.analyzeDistribution(values);
      expect(Math.abs(dist.skewness)).toBeLessThan(0.5); // Close to normal
    });

    it('should identify right-skewed distribution', () => {
      const values = [
        10, 15, 20, 25, 30, 35, 40, 45, 50, // Most values low
        100, 120, 150, 200, // Long tail to right
      ];

      const dist = analyzer.analyzeDistribution(values);
      expect(dist.skewness).toBeGreaterThan(0); // Right skew
    });
  });

  describe('Coefficient of Variation', () => {
    it('should calculate CV correctly', () => {
      const values = [80, 85, 90, 95, 100];
      const cv = analyzer.coefficientOfVariation(values);

      expect(cv).toBeGreaterThan(0);
      expect(cv).toBeLessThan(100); // Should be reasonable percentage
    });
  });

  describe('Dataset Comparison', () => {
    it('should identify different datasets', () => {
      const data1 = [85, 87, 88, 89, 90];
      const data2 = [150, 160, 165, 170, 180]; // Much higher

      const comparison = analyzer.compareDatasets(data1, data2);
      expect(comparison.significantlyDifferent).toBe(true);
      expect(comparison.percentDifference).toBeGreaterThan(50);
    });

    it('should identify similar datasets', () => {
      const data1 = [85, 87, 88, 89, 90];
      const data2 = [86, 88, 89, 90, 91]; // Very similar

      const comparison = analyzer.compareDatasets(data1, data2);
      expect(Math.abs(comparison.percentDifference)).toBeLessThan(5);
    });
  });
});

describe('MetricsAggregator', () => {
  let aggregator: MetricsAggregator;

  beforeEach(() => {
    aggregator = new MetricsAggregator();
  });

  describe('Recording Metrics', () => {
    it('should record metrics from a device', () => {
      const device = COMMON_DEVICE_PROFILES['iphone-15'];
      const metrics: GestureTimingMetrics = {
        gestureType: 'tap',
        platform: 'ios',
        touchDownToResponseMs: 85,
        totalDurationMs: 250,
        frameDrops: 0,
        peakLatencyMs: 16.67,
        avgFrameTimeMs: 16.0,
      };

      aggregator.recordMetrics(device, metrics);

      const deviceMetrics = aggregator.getDeviceMetrics(device.id);
      expect(deviceMetrics).toBeDefined();
      expect(deviceMetrics!.executionCount).toBe(1);
      expect(deviceMetrics!.successCount).toBe(1);
    });

    it('should track multiple metrics per device', () => {
      const device = COMMON_DEVICE_PROFILES['iphone-15'];

      for (let i = 0; i < 5; i++) {
        const metrics: GestureTimingMetrics = {
          gestureType: 'tap',
          platform: 'ios',
          touchDownToResponseMs: 80 + i * 2,
          totalDurationMs: 250,
          frameDrops: 0,
          peakLatencyMs: 16.67,
          avgFrameTimeMs: 16.0,
        };
        aggregator.recordMetrics(device, metrics);
      }

      const deviceMetrics = aggregator.getDeviceMetrics(device.id);
      expect(deviceMetrics!.executionCount).toBe(5);
      expect(deviceMetrics!.successCount).toBe(5);
    });
  });

  describe('Report Generation', () => {
    it('should generate comprehensive report', () => {
      const devices = [
        COMMON_DEVICE_PROFILES['iphone-15'],
        COMMON_DEVICE_PROFILES['iphone-14'],
        COMMON_DEVICE_PROFILES['pixel-8'],
      ];

      // Record metrics from each device
      for (const device of devices) {
        for (let i = 0; i < 3; i++) {
          const latency = device.os === 'ios' ? 85 + i * 2 : 110 + i * 2;
          const metrics: GestureTimingMetrics = {
            gestureType: 'tap',
            platform: device.os,
            touchDownToResponseMs: latency,
            totalDurationMs: 250,
            frameDrops: 0,
            peakLatencyMs: 16.67,
            avgFrameTimeMs: 16.0,
          };
          aggregator.recordMetrics(device, metrics);
        }
      }

      const report = aggregator.generateReport();

      expect(report.totalDevices).toBe(3);
      expect(report.successfulDevices).toBe(3);
      expect(report.gestureMetrics.size).toBeGreaterThan(0);
      expect(report.summaryStats.totalExecutions).toBe(9);
      expect(report.summaryStats.successRate).toBeGreaterThan(0);
    });

    it('should exclude outliers when requested', () => {
      const device = COMMON_DEVICE_PROFILES['iphone-15'];

      // Normal metrics
      for (let i = 0; i < 9; i++) {
        aggregator.recordMetrics(device, {
          gestureType: 'tap',
          platform: 'ios',
          touchDownToResponseMs: 85 + i,
          totalDurationMs: 250,
          frameDrops: 0,
          peakLatencyMs: 16.67,
          avgFrameTimeMs: 16.0,
        });
      }

      // Outlier
      aggregator.recordMetrics(device, {
        gestureType: 'tap',
        platform: 'ios',
        touchDownToResponseMs: 200,
        totalDurationMs: 250,
        frameDrops: 2,
        peakLatencyMs: 20.0,
        avgFrameTimeMs: 17.0,
      });

      const reportWithOutliers = aggregator.generateReport(false);
      const reportWithoutOutliers = aggregator.generateReport(true);

      // Report without outliers should have lower mean
      const tapsWithOut = reportWithoutOutliers.gestureMetrics.get('tap');
      const tapsWithOutliers = reportWithOutliers.gestureMetrics.get('tap');

      expect(tapsWithOut!.allDevices.mean).toBeLessThan(
        tapsWithOutliers!.allDevices.mean,
      );
    });
  });

  describe('Device Comparison', () => {
    it('should compare device performance', () => {
      const devices = [
        COMMON_DEVICE_PROFILES['iphone-15'],
        COMMON_DEVICE_PROFILES['iphone-14'],
        COMMON_DEVICE_PROFILES['pixel-8'],
      ];

      for (const device of devices) {
        const latency = device.id === 'iphone-15' ? 85 :
                       device.id === 'iphone-14' ? 92 : 110;

        aggregator.recordMetrics(device, {
          gestureType: 'tap',
          platform: device.os,
          touchDownToResponseMs: latency,
          totalDurationMs: 250,
          frameDrops: 0,
          peakLatencyMs: 16.67,
          avgFrameTimeMs: 16.0,
        });
      }

      const comparison = aggregator.compareDevices('tap');

      expect(comparison.length).toBe(3);
      expect(comparison[0].rank).toBe(1); // Fastest
      expect(comparison[comparison.length - 1].rank).toBe(3); // Slowest
    });

    it('should identify slowest devices', () => {
      const slowDevice = COMMON_DEVICE_PROFILES['pixel-8'];
      const fastDevice = COMMON_DEVICE_PROFILES['iphone-15'];

      aggregator.recordMetrics(slowDevice, {
        gestureType: 'tap',
        platform: 'android',
        touchDownToResponseMs: 150,
        totalDurationMs: 250,
        frameDrops: 2,
        peakLatencyMs: 20.0,
        avgFrameTimeMs: 17.0,
      });

      aggregator.recordMetrics(fastDevice, {
        gestureType: 'tap',
        platform: 'ios',
        touchDownToResponseMs: 85,
        totalDurationMs: 250,
        frameDrops: 0,
        peakLatencyMs: 16.67,
        avgFrameTimeMs: 16.0,
      });

      const slowest = aggregator.getSlowestDevices('tap', 1);

      expect(slowest.length).toBe(1);
      expect(slowest[0].device.id).toBe('pixel-8');
      expect(slowest[0].latency).toBeGreaterThan(100);
    });

    it('should identify fastest devices', () => {
      const devices = [
        COMMON_DEVICE_PROFILES['iphone-15'],
        COMMON_DEVICE_PROFILES['pixel-8'],
      ];

      aggregator.recordMetrics(devices[0], {
        gestureType: 'tap',
        platform: 'ios',
        touchDownToResponseMs: 85,
        totalDurationMs: 250,
        frameDrops: 0,
        peakLatencyMs: 16.67,
        avgFrameTimeMs: 16.0,
      });

      aggregator.recordMetrics(devices[1], {
        gestureType: 'tap',
        platform: 'android',
        touchDownToResponseMs: 120,
        totalDurationMs: 250,
        frameDrops: 1,
        peakLatencyMs: 18.0,
        avgFrameTimeMs: 16.5,
      });

      const fastest = aggregator.getFastestDevices('tap', 1);

      expect(fastest[0].device.id).toBe('iphone-15');
    });
  });

  describe('Device Summaries', () => {
    it('should generate per-device summaries', () => {
      const device = COMMON_DEVICE_PROFILES['iphone-15'];

      for (let i = 0; i < 5; i++) {
        aggregator.recordMetrics(device, {
          gestureType: 'tap',
          platform: 'ios',
          touchDownToResponseMs: 85 + i,
          totalDurationMs: 250,
          frameDrops: 0,
          peakLatencyMs: 16.67,
          avgFrameTimeMs: 16.0,
        });
      }

      const summaries = aggregator.getDeviceSummaries();

      expect(summaries.length).toBe(1);
      expect(summaries[0].device.id).toBe('iphone-15');
      expect(summaries[0].executionCount).toBe(5);
      expect(summaries[0].successRate).toBe(100);
      expect(summaries[0].avgLatencyMs).toBeGreaterThan(0);
    });
  });

  describe('Reset and Clearing', () => {
    it('should reset all metrics', () => {
      const device = COMMON_DEVICE_PROFILES['iphone-15'];

      aggregator.recordMetrics(device, {
        gestureType: 'tap',
        platform: 'ios',
        touchDownToResponseMs: 85,
        totalDurationMs: 250,
        frameDrops: 0,
        peakLatencyMs: 16.67,
        avgFrameTimeMs: 16.0,
      });

      aggregator.reset();

      const deviceMetrics = aggregator.getDeviceMetrics(device.id);
      expect(deviceMetrics).toBeUndefined();
    });
  });
});

describe('Statistical Helper Functions', () => {
  it('should calculate mean', () => {
    expect(mean([10, 20, 30])).toBe(20);
    expect(mean([85, 90, 95])).toBe(90);
  });

  it('should calculate median', () => {
    expect(median([10, 20, 30])).toBe(20);
    expect(median([10, 20, 30, 40])).toBe(25);
  });

  it('should calculate standard deviation', () => {
    const values = [10, 20, 30];
    const stdDev = standardDeviation(values);
    expect(stdDev).toBeCloseTo(8.16, 1);
  });
});
