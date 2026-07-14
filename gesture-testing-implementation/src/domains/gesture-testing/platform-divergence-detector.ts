/**
 * Platform Divergence Detector for Real Device vs Emulator
 *
 * Detects and reports significant differences in gesture timing between
 * real devices and emulators/simulators. Critical for test reliability.
 *
 * @module gesture-testing/divergence-detector
 */

import type { GestureTimingMetrics, GestureType } from './gesture-timing-validator.js';
import type { DeviceProfile } from './device-profile.js';
import { isVirtualized } from './device-profile.js';

export interface DivergenceMetrics {
  gestureType: GestureType;
  realDeviceMetrics: GestureTimingMetrics;
  virtualDeviceMetrics: GestureTimingMetrics;
  divergencePercent: number; // % difference in latency
  severity: 'acceptable' | 'warning' | 'critical';
  recommendation: 'use-real-device' | 'use-virtual-device' | 'investigate' | 'acceptable';
}

export interface DivergenceReport {
  timestamp: number;
  realDeviceProfile: DeviceProfile;
  virtualDeviceProfile: DeviceProfile;
  gestures: DivergenceMetrics[];
  overallDivergencePercent: number;
  summary: string;
  actionItems: string[];
}

export interface DivergenceThresholds {
  acceptableDivergence: number; // %, default: 15%
  warningDivergence: number; // %, default: 25%
  criticalDivergence: number; // %, default: 40%
}

export const DEFAULT_DIVERGENCE_THRESHOLDS: DivergenceThresholds = {
  acceptableDivergence: 15,
  warningDivergence: 25,
  criticalDivergence: 40,
};

/**
 * Detector for platform divergence between real and virtual devices.
 */
export class PlatformDivergenceDetector {
  private thresholds: DivergenceThresholds;
  private baselineMetrics: Map<string, GestureTimingMetrics> = new Map();

  constructor(thresholds: Partial<DivergenceThresholds> = {}) {
    this.thresholds = {
      ...DEFAULT_DIVERGENCE_THRESHOLDS,
      ...thresholds,
    };
  }

  /**
   * Compare gesture metrics between real and virtual devices.
   */
  compareMetrics(
    gestureType: GestureType,
    realDeviceMetrics: GestureTimingMetrics,
    virtualDeviceMetrics: GestureTimingMetrics,
  ): DivergenceMetrics {
    // Calculate latency divergence (most important for UX)
    const realLatency = realDeviceMetrics.touchDownToResponseMs;
    const virtualLatency = virtualDeviceMetrics.touchDownToResponseMs;

    const divergencePercent = ((virtualLatency - realLatency) / realLatency) * 100;
    const absDivergence = Math.abs(divergencePercent);

    // Determine severity
    let severity: 'acceptable' | 'warning' | 'critical';
    if (absDivergence <= this.thresholds.acceptableDivergence) {
      severity = 'acceptable';
    } else if (absDivergence <= this.thresholds.warningDivergence) {
      severity = 'warning';
    } else {
      severity = 'critical';
    }

    // Determine recommendation
    let recommendation: 'use-real-device' | 'use-virtual-device' | 'investigate' | 'acceptable';

    if (severity === 'acceptable') {
      recommendation = 'acceptable';
    } else if (virtualLatency > realLatency * 1.5) {
      // Virtual device is significantly slower
      recommendation = 'use-real-device';
    } else if (realLatency > virtualLatency * 1.3) {
      // Real device is slower (unusual) - investigate
      recommendation = 'investigate';
    } else {
      recommendation = 'use-real-device'; // Conservative: prefer real device
    }

    return {
      gestureType,
      realDeviceMetrics,
      virtualDeviceMetrics,
      divergencePercent,
      severity,
      recommendation,
    };
  }

  /**
   * Analyze multiple gesture measurements for divergence pattern.
   */
  analyzeGestureSet(
    realDeviceMetrics: GestureTimingMetrics[],
    virtualDeviceMetrics: GestureTimingMetrics[],
  ): DivergenceMetrics[] {
    if (realDeviceMetrics.length !== virtualDeviceMetrics.length) {
      throw new Error(
        'Real and virtual device metrics must have same length',
      );
    }

    return realDeviceMetrics.map((realMetrics, index) => {
      const virtualMetrics = virtualDeviceMetrics[index];

      if (realMetrics.gestureType !== virtualMetrics.gestureType) {
        throw new Error(
          `Gesture type mismatch at index ${index}: ${realMetrics.gestureType} vs ${virtualMetrics.gestureType}`,
        );
      }

      return this.compareMetrics(realMetrics.gestureType, realMetrics, virtualMetrics);
    });
  }

  /**
   * Generate comprehensive divergence report.
   */
  generateReport(
    realDeviceProfile: DeviceProfile,
    virtualDeviceProfile: DeviceProfile,
    divergenceMetrics: DivergenceMetrics[],
  ): DivergenceReport {
    // Calculate overall divergence
    const latencyDivergences = divergenceMetrics.map(m => Math.abs(m.divergencePercent));
    const overallDivergencePercent =
      latencyDivergences.reduce((a, b) => a + b, 0) / latencyDivergences.length;

    // Count severity levels
    const criticalCount = divergenceMetrics.filter(m => m.severity === 'critical').length;
    const warningCount = divergenceMetrics.filter(m => m.severity === 'warning').length;
    const acceptableCount = divergenceMetrics.filter(m => m.severity === 'acceptable').length;

    // Generate summary
    const summary = this.generateSummary(
      realDeviceProfile,
      virtualDeviceProfile,
      overallDivergencePercent,
      criticalCount,
      warningCount,
      acceptableCount,
    );

    // Generate action items
    const actionItems = this.generateActionItems(
      divergenceMetrics,
      overallDivergencePercent,
      realDeviceProfile,
      virtualDeviceProfile,
    );

    return {
      timestamp: Date.now(),
      realDeviceProfile,
      virtualDeviceProfile,
      gestures: divergenceMetrics,
      overallDivergencePercent,
      summary,
      actionItems,
    };
  }

  /**
   * Set baseline metrics for regression tracking.
   */
  setBaseline(deviceId: string, metrics: GestureTimingMetrics): void {
    this.baselineMetrics.set(deviceId, metrics);
  }

  /**
   * Check if current metrics regress from baseline.
   */
  checkRegression(
    deviceId: string,
    currentMetrics: GestureTimingMetrics,
    regressionThreshold: number = 1.2, // 20% slower = regression
  ): { isRegression: boolean; degradation: number } {
    const baseline = this.baselineMetrics.get(deviceId);

    if (!baseline) {
      return { isRegression: false, degradation: 0 };
    }

    const degradation = currentMetrics.touchDownToResponseMs / baseline.touchDownToResponseMs;

    return {
      isRegression: degradation > regressionThreshold,
      degradation,
    };
  }

  /**
   * Predict which device type to use for testing.
   */
  selectOptimalDeviceType(
    divergenceMetrics: DivergenceMetrics[],
    userPreference?: 'real-device' | 'virtual-device' | 'auto',
  ): 'real-device' | 'virtual-device' {
    if (userPreference === 'real-device') {
      return 'real-device';
    }

    if (userPreference === 'virtual-device') {
      return 'virtual-device';
    }

    // Auto-select based on divergence
    const criticalGestures = divergenceMetrics.filter(m => m.severity === 'critical');
    const acceptableGestures = divergenceMetrics.filter(m => m.severity === 'acceptable');

    // If too much divergence, use real device
    if (criticalGestures.length > 0) {
      return 'real-device';
    }

    // If most gestures are acceptable, can use virtual device
    if (acceptableGestures.length / divergenceMetrics.length > 0.8) {
      return 'virtual-device';
    }

    // Default to real device for critical paths
    return 'real-device';
  }

  private generateSummary(
    realDeviceProfile: DeviceProfile,
    virtualDeviceProfile: DeviceProfile,
    overallDivergence: number,
    criticalCount: number,
    warningCount: number,
    acceptableCount: number,
  ): string {
    const parts = [
      `Platform Divergence Analysis: ${realDeviceProfile.name} vs ${virtualDeviceProfile.name}`,
      `Overall Divergence: ${overallDivergence.toFixed(1)}%`,
      `Results: ${acceptableCount} ✅ ${warningCount} ⚠️ ${criticalCount} ❌`,
    ];

    if (criticalCount > 0) {
      parts.push(
        `⚠️ CRITICAL: ${criticalCount} gesture(s) show severe divergence (>40%)`,
      );
      parts.push('Recommendation: Use real device for critical test paths');
    } else if (warningCount > 0) {
      parts.push(
        `⚠️ WARNING: ${warningCount} gesture(s) show moderate divergence (15-40%)`,
      );
      parts.push('Recommendation: Validate results on real device before shipping');
    } else {
      parts.push('✅ ACCEPTABLE: Platform timing is consistent');
      parts.push('Virtual device can be used for fast CI feedback');
    }

    return parts.join('\n');
  }

  private generateActionItems(
    divergenceMetrics: DivergenceMetrics[],
    overallDivergence: number,
    realDeviceProfile: DeviceProfile,
    virtualDeviceProfile: DeviceProfile,
  ): string[] {
    const items: string[] = [];

    if (overallDivergence > 40) {
      items.push(
        `1. URGENT: Add real device testing - divergence ${overallDivergence.toFixed(1)}% exceeds 40% threshold`,
      );
      items.push(
        '2. Review test environment: Check CPU/memory load on virtual device host',
      );
    } else if (overallDivergence > 25) {
      items.push(
        `1. Monitor divergence: ${overallDivergence.toFixed(1)}% is elevated (target: <15%)`,
      );
      items.push(
        '2. Recommend real device for critical paths (checkout, payment, login)',
      );
    } else if (overallDivergence > 15) {
      items.push(
        `1. Platform divergence is acceptable (${overallDivergence.toFixed(1)}%)`,
      );
      items.push('2. Use virtual device for fast feedback, real device for critical paths');
    } else {
      items.push('✅ No action needed - platform timing is consistent');
    }

    // Gesture-specific recommendations
    const criticalGestures = divergenceMetrics.filter(m => m.severity === 'critical');
    if (criticalGestures.length > 0) {
      const gestureList = criticalGestures.map(g => g.gestureType).join(', ');
      items.push(`3. Investigate: ${gestureList} show critical divergence`);
    }

    // Device-specific recommendations
    if (virtualDeviceProfile.type === 'emulator') {
      items.push(
        `4. Emulator optimization: Consider enabling GPU acceleration for ${virtualDeviceProfile.os}`,
      );
    }

    return items;
  }
}

/**
 * Quick helper to format divergence percentage for display.
 */
export function formatDivergence(percent: number): string {
  if (Math.abs(percent) < 15) {
    return `${percent.toFixed(1)}% ✅`;
  } else if (Math.abs(percent) < 25) {
    return `${percent.toFixed(1)}% ⚠️`;
  } else {
    return `${percent.toFixed(1)}% ❌`;
  }
}

/**
 * Calculate median divergence from multiple measurements.
 */
export function calculateMedianDivergence(divergences: number[]): number {
  if (divergences.length === 0) return 0;

  const sorted = [...divergences].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }

  return sorted[mid];
}
