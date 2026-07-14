/**
 * Metrics Aggregator for Multi-Device Testing
 *
 * Aggregates gesture timing metrics from multiple devices (real or virtual).
 * Performs statistical analysis and generates device-specific insights.
 *
 * @module gesture-testing/metrics-aggregator
 */

import type { GestureTimingMetrics, GestureType } from './gesture-timing-validator.js';
import type { DeviceProfile } from './device-profile.js';
import type { StatisticalSummary } from './statistical-analyzer.js';
import {
  StatisticalAnalyzer,
  formatStatisticalSummary,
} from './statistical-analyzer.js';

export interface DeviceMetrics {
  device: DeviceProfile;
  gestures: Map<GestureType, GestureTimingMetrics[]>;
  executionCount: number;
  successCount: number;
  failureCount: number;
  lastUpdated: number;
}

export interface AggregatedMetrics {
  gestureType: GestureType;
  allDevices: StatisticalSummary;
  byDeviceType: Record<string, StatisticalSummary>; // 'real-device', 'emulator', 'simulator'
  byTier: Record<string, StatisticalSummary>; // 'tier-1', 'tier-2', 'tier-3'
  byPlatform: Record<string, StatisticalSummary>; // 'ios', 'android'
  outlierDevices: Array<{
    device: DeviceProfile;
    latency: number;
    deviation: number; // How many std devs from mean
    severity: 'mild' | 'extreme';
  }>;
}

export interface AggregationReport {
  timestamp: number;
  totalDevices: number;
  successfulDevices: number;
  failedDevices: number;
  gestureMetrics: Map<GestureType, AggregatedMetrics>;
  summaryStats: {
    totalExecutions: number;
    successRate: number;
    avgExecutionTimeMs: number;
  };
  issues: Array<{
    type: 'outlier' | 'slow' | 'inconsistent' | 'failure';
    device: string;
    gesture: GestureType;
    message: string;
    severity: 'warning' | 'critical';
  }>;
}

/**
 * Aggregates metrics from multiple devices.
 */
export class MetricsAggregator {
  private deviceMetrics: Map<string, DeviceMetrics> = new Map();
  private analyzer: StatisticalAnalyzer;

  constructor() {
    this.analyzer = new StatisticalAnalyzer();
  }

  /**
   * Record metrics from a device execution.
   */
  recordMetrics(device: DeviceProfile, metrics: GestureTimingMetrics): void {
    const deviceId = device.id;
    let deviceMetrics = this.deviceMetrics.get(deviceId);

    if (!deviceMetrics) {
      deviceMetrics = {
        device,
        gestures: new Map(),
        executionCount: 0,
        successCount: 0,
        failureCount: 0,
        lastUpdated: Date.now(),
      };
      this.deviceMetrics.set(deviceId, deviceMetrics);
    }

    // Add metric to gesture list
    if (!deviceMetrics.gestures.has(metrics.gestureType)) {
      deviceMetrics.gestures.set(metrics.gestureType, []);
    }
    deviceMetrics.gestures.get(metrics.gestureType)!.push(metrics);

    // Update stats
    deviceMetrics.executionCount++;
    if (metrics.touchDownToResponseMs > 0) {
      deviceMetrics.successCount++;
    } else {
      deviceMetrics.failureCount++;
    }
    deviceMetrics.lastUpdated = Date.now();
  }

  /**
   * Aggregate all metrics and generate report.
   */
  generateReport(excludeOutliers: boolean = true): AggregationReport {
    const report: AggregationReport = {
      timestamp: Date.now(),
      totalDevices: this.deviceMetrics.size,
      successfulDevices: 0,
      failedDevices: 0,
      gestureMetrics: new Map(),
      summaryStats: {
        totalExecutions: 0,
        successRate: 0,
        avgExecutionTimeMs: 0,
      },
      issues: [],
    };

    // Collect all latencies by gesture
    const latenciesByGesture: Map<GestureType, number[]> = new Map();
    let totalLatency = 0;
    let totalCount = 0;

    for (const deviceMetrics of this.deviceMetrics.values()) {
      if (deviceMetrics.successCount > 0) {
        report.successfulDevices++;
      }
      if (deviceMetrics.failureCount > 0) {
        report.failedDevices++;
      }

      for (const [gestureType, metrics] of deviceMetrics.gestures) {
        if (!latenciesByGesture.has(gestureType)) {
          latenciesByGesture.set(gestureType, []);
        }

        for (const metric of metrics) {
          if (metric.touchDownToResponseMs > 0) {
            latenciesByGesture.get(gestureType)!.push(
              metric.touchDownToResponseMs,
            );
            totalLatency += metric.touchDownToResponseMs;
            totalCount++;
          }
        }
      }
    }

    // Generate metrics per gesture
    for (const [gestureType, latencies] of latenciesByGesture) {
      if (latencies.length > 0) {
        const aggregated = this.aggregateLatencies(
          gestureType,
          latencies,
          excludeOutliers,
        );
        report.gestureMetrics.set(gestureType, aggregated);

        // Detect issues
        this.detectIssues(aggregated, gestureType, report.issues);
      }
    }

    // Calculate summary stats
    report.summaryStats.totalExecutions = totalCount;
    report.summaryStats.successRate =
      totalCount > 0
        ? (totalCount /
            Array.from(this.deviceMetrics.values()).reduce(
              (sum, d) => sum + d.executionCount,
              0,
            )) *
          100
        : 0;
    report.summaryStats.avgExecutionTimeMs =
      totalCount > 0 ? totalLatency / totalCount : 0;

    return report;
  }

  /**
   * Get per-device summary.
   */
  getDeviceSummaries(): Array<{
    device: DeviceProfile;
    executionCount: number;
    successRate: number;
    avgLatencyMs: number;
    issueCount: number;
  }> {
    return Array.from(this.deviceMetrics.values()).map(deviceMetrics => {
      const totalLatency = Array.from(deviceMetrics.gestures.values())
        .flat()
        .filter(m => m.touchDownToResponseMs > 0)
        .reduce((sum, m) => sum + m.touchDownToResponseMs, 0);

      const successfulMetrics = Array.from(deviceMetrics.gestures.values())
        .flat()
        .filter(m => m.touchDownToResponseMs > 0).length;

      return {
        device: deviceMetrics.device,
        executionCount: deviceMetrics.executionCount,
        successRate:
          (deviceMetrics.successCount / deviceMetrics.executionCount) * 100,
        avgLatencyMs:
          successfulMetrics > 0 ? totalLatency / successfulMetrics : 0,
        issueCount: deviceMetrics.failureCount,
      };
    });
  }

  /**
   * Compare performance across devices.
   */
  compareDevices(
    gestureType: GestureType,
  ): Array<{
    device: DeviceProfile;
    latency: number;
    rank: number;
    percentageOfMean: number;
  }> {
    const results: Array<{
      device: DeviceProfile;
      latency: number;
      rank: number;
      percentageOfMean: number;
    }> = [];

    const latencies: number[] = [];

    for (const deviceMetrics of this.deviceMetrics.values()) {
      const metrics = deviceMetrics.gestures.get(gestureType) || [];
      const validMetrics = metrics.filter(m => m.touchDownToResponseMs > 0);

      if (validMetrics.length > 0) {
        const avgLatency =
          validMetrics.reduce((sum, m) => sum + m.touchDownToResponseMs, 0) /
          validMetrics.length;
        latencies.push(avgLatency);
        results.push({
          device: deviceMetrics.device,
          latency: avgLatency,
          rank: 0, // Will be set after sorting
          percentageOfMean: 0, // Will be calculated
        });
      }
    }

    if (latencies.length === 0) {
      return [];
    }

    const mean = latencies.reduce((a, b) => a + b, 0) / latencies.length;

    // Sort by latency
    results.sort((a, b) => a.latency - b.latency);

    // Set ranks and percentages
    for (let i = 0; i < results.length; i++) {
      results[i].rank = i + 1;
      results[i].percentageOfMean = (results[i].latency / mean) * 100;
    }

    return results;
  }

  /**
   * Get slowest devices.
   */
  getSlowestDevices(
    gestureType: GestureType,
    limit: number = 5,
  ): Array<{ device: DeviceProfile; latency: number }> {
    const comparison = this.compareDevices(gestureType);
    return comparison.slice(-limit).reverse().map(c => ({
      device: c.device,
      latency: c.latency,
    }));
  }

  /**
   * Get fastest devices.
   */
  getFastestDevices(
    gestureType: GestureType,
    limit: number = 5,
  ): Array<{ device: DeviceProfile; latency: number }> {
    const comparison = this.compareDevices(gestureType);
    return comparison.slice(0, limit).map(c => ({
      device: c.device,
      latency: c.latency,
    }));
  }

  /**
   * Private: aggregate latencies by device type, tier, platform.
   */
  private aggregateLatencies(
    gestureType: GestureType,
    latencies: number[],
    excludeOutliers: boolean,
  ): AggregatedMetrics {
    let workingData = latencies;

    if (excludeOutliers) {
      const cleaned = this.analyzer.removeOutliers(latencies);
      workingData = cleaned.cleaned;
    }

    const allStats = this.analyzer.analyze(workingData);

    // Group by device type
    const byDeviceType: Record<string, number[]> = {};
    const byTier: Record<string, number[]> = {};
    const byPlatform: Record<string, number[]> = {};

    for (const deviceMetrics of this.deviceMetrics.values()) {
      const metrics = deviceMetrics.gestures.get(gestureType) || [];
      const validLatencies = metrics
        .filter(m => m.touchDownToResponseMs > 0)
        .map(m => m.touchDownToResponseMs)
        .filter(l => workingData.includes(l));

      if (validLatencies.length > 0) {
        const deviceType = deviceMetrics.device.type;
        const tier = deviceMetrics.device.tier;
        const platform = deviceMetrics.device.os;

        if (!byDeviceType[deviceType]) byDeviceType[deviceType] = [];
        if (!byTier[tier]) byTier[tier] = [];
        if (!byPlatform[platform]) byPlatform[platform] = [];

        byDeviceType[deviceType].push(...validLatencies);
        byTier[tier].push(...validLatencies);
        byPlatform[platform].push(...validLatencies);
      }
    }

    // Detect outlier devices
    const outlierDevices: AggregatedMetrics['outlierDevices'] = [];
    for (const deviceMetrics of this.deviceMetrics.values()) {
      const metrics = deviceMetrics.gestures.get(gestureType) || [];
      const validMetrics = metrics.filter(m => m.touchDownToResponseMs > 0);

      if (validMetrics.length > 0) {
        const avgLatency =
          validMetrics.reduce((sum, m) => sum + m.touchDownToResponseMs, 0) /
          validMetrics.length;
        const deviation =
          (avgLatency - allStats.mean) / allStats.stdDev;

        if (Math.abs(deviation) > 2) {
          outlierDevices.push({
            device: deviceMetrics.device,
            latency: avgLatency,
            deviation,
            severity: Math.abs(deviation) > 3 ? 'extreme' : 'mild',
          });
        }
      }
    }

    return {
      gestureType,
      allDevices: allStats,
      byDeviceType: Object.fromEntries(
        Object.entries(byDeviceType).map(([type, data]) => [
          type,
          this.analyzer.analyze(data),
        ]),
      ),
      byTier: Object.fromEntries(
        Object.entries(byTier).map(([tier, data]) => [
          tier,
          this.analyzer.analyze(data),
        ]),
      ),
      byPlatform: Object.fromEntries(
        Object.entries(byPlatform).map(([platform, data]) => [
          platform,
          this.analyzer.analyze(data),
        ]),
      ),
      outlierDevices,
    };
  }

  /**
   * Private: detect issues from aggregated metrics.
   */
  private detectIssues(
    aggregated: AggregatedMetrics,
    gestureType: GestureType,
    issues: AggregationReport['issues'],
  ): void {
    const allDevices = aggregated.allDevices;

    // Check for outlier devices
    for (const outlier of aggregated.outlierDevices) {
      issues.push({
        type: 'outlier',
        device: outlier.device.name,
        gesture: gestureType,
        message:
          `${outlier.device.name} latency ${outlier.latency.toFixed(1)}ms ` +
          `(${Math.abs(outlier.deviation).toFixed(1)} std devs from mean)`,
        severity: outlier.severity === 'extreme' ? 'critical' : 'warning',
      });
    }

    // Check for slow devices
    if (allDevices.p95 > 150) {
      issues.push({
        type: 'slow',
        device: 'P95',
        gesture: gestureType,
        message: `95th percentile latency ${allDevices.p95.toFixed(1)}ms exceeds 150ms`,
        severity: 'warning',
      });
    }

    // Check for high variability
    const cv = this.analyzer.coefficientOfVariation(
      Array.from(aggregated.allDevices as any).map((v: any) => v),
    );
    if (cv > 30) {
      issues.push({
        type: 'inconsistent',
        device: 'All',
        gesture: gestureType,
        message: `High variability across devices (CV: ${cv.toFixed(1)}%)`,
        severity: 'warning',
      });
    }
  }

  /**
   * Clear all stored metrics.
   */
  reset(): void {
    this.deviceMetrics.clear();
  }

  /**
   * Get metrics for a specific device.
   */
  getDeviceMetrics(deviceId: string): DeviceMetrics | undefined {
    return this.deviceMetrics.get(deviceId);
  }

  /**
   * Get all device metrics.
   */
  getAllDeviceMetrics(): DeviceMetrics[] {
    return Array.from(this.deviceMetrics.values());
  }
}
