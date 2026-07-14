/**
 * Tests for Platform Divergence Detector
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  PlatformDivergenceDetector,
  formatDivergence,
  calculateMedianDivergence,
  DEFAULT_DIVERGENCE_THRESHOLDS,
} from '@domains/gesture-testing/platform-divergence-detector';
import { COMMON_DEVICE_PROFILES } from '@domains/gesture-testing/device-profile';
import type { GestureTimingMetrics } from '@domains/gesture-testing/gesture-timing-validator';

describe('PlatformDivergenceDetector', () => {
  let detector: PlatformDivergenceDetector;

  beforeEach(() => {
    detector = new PlatformDivergenceDetector();
  });

  describe('Basic Divergence Detection', () => {
    it('should detect acceptable divergence (<15%)', () => {
      const realMetrics: GestureTimingMetrics = {
        gestureType: 'tap',
        platform: 'ios',
        touchDownToResponseMs: 85,
        totalDurationMs: 250,
        frameDrops: 0,
        peakLatencyMs: 16.67,
        avgFrameTimeMs: 16.0,
      };

      const virtualMetrics: GestureTimingMetrics = {
        gestureType: 'tap',
        platform: 'ios',
        touchDownToResponseMs: 95, // ~12% slower
        totalDurationMs: 260,
        frameDrops: 1,
        peakLatencyMs: 18.0,
        avgFrameTimeMs: 16.5,
      };

      const result = detector.compareMetrics('tap', realMetrics, virtualMetrics);

      expect(result.severity).toBe('acceptable');
      expect(result.recommendation).toBe('acceptable');
      expect(Math.abs(result.divergencePercent)).toBeLessThan(15);
    });

    it('should detect warning divergence (15-25%)', () => {
      const realMetrics: GestureTimingMetrics = {
        gestureType: 'tap',
        platform: 'ios',
        touchDownToResponseMs: 85,
        totalDurationMs: 250,
        frameDrops: 0,
        peakLatencyMs: 16.67,
        avgFrameTimeMs: 16.0,
      };

      const virtualMetrics: GestureTimingMetrics = {
        gestureType: 'tap',
        platform: 'ios',
        touchDownToResponseMs: 105, // ~24% slower
        totalDurationMs: 270,
        frameDrops: 2,
        peakLatencyMs: 20.0,
        avgFrameTimeMs: 17.0,
      };

      const result = detector.compareMetrics('tap', realMetrics, virtualMetrics);

      expect(result.severity).toBe('warning');
      expect(result.recommendation).toBe('use-real-device');
      expect(Math.abs(result.divergencePercent)).toBeGreaterThan(15);
    });

    it('should detect critical divergence (>40%)', () => {
      const realMetrics: GestureTimingMetrics = {
        gestureType: 'tap',
        platform: 'ios',
        touchDownToResponseMs: 85,
        totalDurationMs: 250,
        frameDrops: 0,
        peakLatencyMs: 16.67,
        avgFrameTimeMs: 16.0,
      };

      const virtualMetrics: GestureTimingMetrics = {
        gestureType: 'tap',
        platform: 'ios',
        touchDownToResponseMs: 125, // ~47% slower
        totalDurationMs: 300,
        frameDrops: 4,
        peakLatencyMs: 25.0,
        avgFrameTimeMs: 18.5,
      };

      const result = detector.compareMetrics('tap', realMetrics, virtualMetrics);

      expect(result.severity).toBe('critical');
      expect(result.recommendation).toBe('use-real-device');
      expect(Math.abs(result.divergencePercent)).toBeGreaterThan(40);
    });
  });

  describe('Multiple Gesture Analysis', () => {
    it('should analyze gesture set and return comparable results', () => {
      const realMetrics: GestureTimingMetrics[] = [
        {
          gestureType: 'tap',
          platform: 'ios',
          touchDownToResponseMs: 85,
          totalDurationMs: 250,
          frameDrops: 0,
          peakLatencyMs: 16.67,
          avgFrameTimeMs: 16.0,
        },
        {
          gestureType: 'swipe',
          platform: 'ios',
          touchDownToResponseMs: 95,
          totalDurationMs: 400,
          frameDrops: 1,
          peakLatencyMs: 17.0,
          avgFrameTimeMs: 16.2,
        },
        {
          gestureType: 'pinch',
          platform: 'ios',
          touchDownToResponseMs: 90,
          totalDurationMs: 350,
          frameDrops: 0,
          peakLatencyMs: 16.67,
          avgFrameTimeMs: 16.1,
        },
      ];

      const virtualMetrics: GestureTimingMetrics[] = [
        {
          gestureType: 'tap',
          platform: 'ios',
          touchDownToResponseMs: 95,
          totalDurationMs: 260,
          frameDrops: 1,
          peakLatencyMs: 18.0,
          avgFrameTimeMs: 16.5,
        },
        {
          gestureType: 'swipe',
          platform: 'ios',
          touchDownToResponseMs: 110,
          totalDurationMs: 420,
          frameDrops: 2,
          peakLatencyMs: 19.0,
          avgFrameTimeMs: 16.8,
        },
        {
          gestureType: 'pinch',
          platform: 'ios',
          touchDownToResponseMs: 100,
          totalDurationMs: 370,
          frameDrops: 1,
          peakLatencyMs: 18.5,
          avgFrameTimeMs: 16.4,
        },
      ];

      const results = detector.analyzeGestureSet(realMetrics, virtualMetrics);

      expect(results).toHaveLength(3);
      expect(results[0].gestureType).toBe('tap');
      expect(results[1].gestureType).toBe('swipe');
      expect(results[2].gestureType).toBe('pinch');
      expect(results.every(r => r.severity === 'acceptable' || r.severity === 'warning')).toBe(
        true,
      );
    });

    it('should throw on gesture type mismatch', () => {
      const realMetrics: GestureTimingMetrics[] = [
        {
          gestureType: 'tap',
          platform: 'ios',
          touchDownToResponseMs: 85,
          totalDurationMs: 250,
          frameDrops: 0,
          peakLatencyMs: 16.67,
          avgFrameTimeMs: 16.0,
        },
      ];

      const virtualMetrics: GestureTimingMetrics[] = [
        {
          gestureType: 'swipe', // Mismatch!
          platform: 'ios',
          touchDownToResponseMs: 95,
          totalDurationMs: 260,
          frameDrops: 1,
          peakLatencyMs: 18.0,
          avgFrameTimeMs: 16.5,
        },
      ];

      expect(() => detector.analyzeGestureSet(realMetrics, virtualMetrics)).toThrow();
    });
  });

  describe('Report Generation', () => {
    it('should generate comprehensive divergence report', () => {
      const realDevice = COMMON_DEVICE_PROFILES['iphone-15-pro'];
      const virtualDevice = COMMON_DEVICE_PROFILES['ios-simulator-iphone15'];

      const divergenceMetrics = [
        {
          gestureType: 'tap' as const,
          realDeviceMetrics: {
            gestureType: 'tap' as const,
            platform: 'ios' as const,
            touchDownToResponseMs: 85,
            totalDurationMs: 250,
            frameDrops: 0,
            peakLatencyMs: 16.67,
            avgFrameTimeMs: 16.0,
          },
          virtualDeviceMetrics: {
            gestureType: 'tap' as const,
            platform: 'ios' as const,
            touchDownToResponseMs: 95,
            totalDurationMs: 260,
            frameDrops: 1,
            peakLatencyMs: 18.0,
            avgFrameTimeMs: 16.5,
          },
          divergencePercent: 11.76,
          severity: 'acceptable' as const,
          recommendation: 'acceptable' as const,
        },
      ];

      const report = detector.generateReport(
        realDevice,
        virtualDevice,
        divergenceMetrics,
      );

      expect(report.timestamp).toBeLessThanOrEqual(Date.now());
      expect(report.realDeviceProfile.name).toBe('iPhone 15 Pro');
      expect(report.virtualDeviceProfile.name).toBe('iOS Simulator (iPhone 15)');
      expect(report.gestures).toHaveLength(1);
      expect(report.summary).toContain('Platform Divergence Analysis');
      expect(report.actionItems).toBeDefined();
      expect(Array.isArray(report.actionItems)).toBe(true);
    });

    it('should generate critical report for high divergence', () => {
      const realDevice = COMMON_DEVICE_PROFILES['pixel-8'];
      const virtualDevice = COMMON_DEVICE_PROFILES['android-emulator-pixel8'];

      const divergenceMetrics = [
        {
          gestureType: 'tap' as const,
          realDeviceMetrics: {
            gestureType: 'tap' as const,
            platform: 'android' as const,
            touchDownToResponseMs: 110,
            totalDurationMs: 300,
            frameDrops: 1,
            peakLatencyMs: 16.67,
            avgFrameTimeMs: 16.3,
          },
          virtualDeviceMetrics: {
            gestureType: 'tap' as const,
            platform: 'android' as const,
            touchDownToResponseMs: 160, // 45% divergence
            totalDurationMs: 350,
            frameDrops: 4,
            peakLatencyMs: 25.0,
            avgFrameTimeMs: 18.5,
          },
          divergencePercent: 45.45,
          severity: 'critical' as const,
          recommendation: 'use-real-device' as const,
        },
      ];

      const report = detector.generateReport(
        realDevice,
        virtualDevice,
        divergenceMetrics,
      );

      expect(report.summary).toContain('CRITICAL');
      expect(report.actionItems.some(item => item.includes('URGENT'))).toBe(true);
    });
  });

  describe('Baseline and Regression Tracking', () => {
    it('should set and check baseline metrics', () => {
      const baseline: GestureTimingMetrics = {
        gestureType: 'tap',
        platform: 'ios',
        touchDownToResponseMs: 85,
        totalDurationMs: 250,
        frameDrops: 0,
        peakLatencyMs: 16.67,
        avgFrameTimeMs: 16.0,
      };

      detector.setBaseline('iphone-15', baseline);

      const currentMetrics: GestureTimingMetrics = {
        gestureType: 'tap',
        platform: 'ios',
        touchDownToResponseMs: 95, // 11% slower
        totalDurationMs: 260,
        frameDrops: 1,
        peakLatencyMs: 18.0,
        avgFrameTimeMs: 16.5,
      };

      const { isRegression, degradation } = detector.checkRegression(
        'iphone-15',
        currentMetrics,
        1.2, // 20% threshold
      );

      expect(isRegression).toBe(false); // 11% < 20%
      expect(degradation).toBeCloseTo(1.118, 2);
    });

    it('should detect regression when crossing threshold', () => {
      const baseline: GestureTimingMetrics = {
        gestureType: 'tap',
        platform: 'ios',
        touchDownToResponseMs: 85,
        totalDurationMs: 250,
        frameDrops: 0,
        peakLatencyMs: 16.67,
        avgFrameTimeMs: 16.0,
      };

      detector.setBaseline('iphone-15', baseline);

      const currentMetrics: GestureTimingMetrics = {
        gestureType: 'tap',
        platform: 'ios',
        touchDownToResponseMs: 105, // 24% slower
        totalDurationMs: 270,
        frameDrops: 2,
        peakLatencyMs: 20.0,
        avgFrameTimeMs: 17.0,
      };

      const { isRegression, degradation } = detector.checkRegression(
        'iphone-15',
        currentMetrics,
        1.2, // 20% threshold
      );

      expect(isRegression).toBe(true); // 24% > 20%
      expect(degradation).toBeCloseTo(1.235, 2);
    });

    it('should return no regression if baseline not set', () => {
      const currentMetrics: GestureTimingMetrics = {
        gestureType: 'tap',
        platform: 'ios',
        touchDownToResponseMs: 105,
        totalDurationMs: 270,
        frameDrops: 2,
        peakLatencyMs: 20.0,
        avgFrameTimeMs: 17.0,
      };

      const { isRegression } = detector.checkRegression('unknown-device', currentMetrics);

      expect(isRegression).toBe(false);
    });
  });

  describe('Device Selection', () => {
    it('should select real device for critical divergence', () => {
      const divergenceMetrics = [
        {
          gestureType: 'tap' as const,
          realDeviceMetrics: {} as any,
          virtualDeviceMetrics: {} as any,
          divergencePercent: 45,
          severity: 'critical' as const,
          recommendation: 'use-real-device' as const,
        },
      ];

      const selected = detector.selectOptimalDeviceType(divergenceMetrics, 'auto');

      expect(selected).toBe('real-device');
    });

    it('should select virtual device if mostly acceptable', () => {
      const divergenceMetrics = [
        {
          gestureType: 'tap' as const,
          realDeviceMetrics: {} as any,
          virtualDeviceMetrics: {} as any,
          divergencePercent: 10,
          severity: 'acceptable' as const,
          recommendation: 'acceptable' as const,
        },
        {
          gestureType: 'swipe' as const,
          realDeviceMetrics: {} as any,
          virtualDeviceMetrics: {} as any,
          divergencePercent: 8,
          severity: 'acceptable' as const,
          recommendation: 'acceptable' as const,
        },
        {
          gestureType: 'pinch' as const,
          realDeviceMetrics: {} as any,
          virtualDeviceMetrics: {} as any,
          divergencePercent: 12,
          severity: 'acceptable' as const,
          recommendation: 'acceptable' as const,
        },
      ];

      const selected = detector.selectOptimalDeviceType(divergenceMetrics, 'auto');

      expect(selected).toBe('virtual-device');
    });

    it('should respect user preference override', () => {
      const divergenceMetrics = [
        {
          gestureType: 'tap' as const,
          realDeviceMetrics: {} as any,
          virtualDeviceMetrics: {} as any,
          divergencePercent: 50,
          severity: 'critical' as const,
          recommendation: 'use-real-device' as const,
        },
      ];

      const selected = detector.selectOptimalDeviceType(
        divergenceMetrics,
        'virtual-device', // Force virtual despite critical divergence
      );

      expect(selected).toBe('virtual-device');
    });
  });

  describe('Custom Thresholds', () => {
    it('should apply custom divergence thresholds', () => {
      const customDetector = new PlatformDivergenceDetector({
        acceptableDivergence: 20, // Raise from 15%
        criticalDivergence: 50, // Raise from 40%
      });

      const realMetrics: GestureTimingMetrics = {
        gestureType: 'tap',
        platform: 'ios',
        touchDownToResponseMs: 85,
        totalDurationMs: 250,
        frameDrops: 0,
        peakLatencyMs: 16.67,
        avgFrameTimeMs: 16.0,
      };

      const virtualMetrics: GestureTimingMetrics = {
        gestureType: 'tap',
        platform: 'ios',
        touchDownToResponseMs: 100, // 18% divergence
        totalDurationMs: 260,
        frameDrops: 1,
        peakLatencyMs: 18.0,
        avgFrameTimeMs: 16.5,
      };

      const result = customDetector.compareMetrics('tap', realMetrics, virtualMetrics);

      expect(result.severity).toBe('acceptable'); // With default would be warning
    });
  });
});

describe('Utility Functions', () => {
  describe('formatDivergence', () => {
    it('should format acceptable divergence with green check', () => {
      const formatted = formatDivergence(10);
      expect(formatted).toContain('✅');
      expect(formatted).toContain('10.0%');
    });

    it('should format warning divergence with yellow warning', () => {
      const formatted = formatDivergence(20);
      expect(formatted).toContain('⚠️');
      expect(formatted).toContain('20.0%');
    });

    it('should format critical divergence with red x', () => {
      const formatted = formatDivergence(50);
      expect(formatted).toContain('❌');
      expect(formatted).toContain('50.0%');
    });
  });

  describe('calculateMedianDivergence', () => {
    it('should calculate median of odd-length array', () => {
      const divergences = [10, 15, 20];
      const median = calculateMedianDivergence(divergences);
      expect(median).toBe(15);
    });

    it('should calculate median of even-length array', () => {
      const divergences = [10, 15, 20, 25];
      const median = calculateMedianDivergence(divergences);
      expect(median).toBe(17.5);
    });

    it('should handle empty array', () => {
      const median = calculateMedianDivergence([]);
      expect(median).toBe(0);
    });

    it('should handle single element', () => {
      const divergences = [42];
      const median = calculateMedianDivergence(divergences);
      expect(median).toBe(42);
    });
  });
});
