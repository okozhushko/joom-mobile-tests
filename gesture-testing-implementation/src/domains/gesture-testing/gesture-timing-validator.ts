/**
 * Gesture Timing Validator for Mobile Testing
 *
 * Validates gesture execution timing to ensure mobile app responsiveness.
 * Critical for user experience - measures latency from touch input to visual feedback.
 *
 * @module gesture-testing/validator
 */

export type GestureType = 'tap' | 'swipe' | 'pinch' | 'long-press' | 'double-tap' | 'rotate';
export type Platform = 'ios' | 'android';

export interface GestureTimingMetrics {
  gestureType: GestureType;
  platform: Platform;
  touchDownToResponseMs: number; // Time from touch down to first visual change
  totalDurationMs: number; // Total gesture duration
  frameDrops: number; // Number of dropped frames during gesture
  peakLatencyMs: number; // Highest single-frame latency
  avgFrameTimeMs: number; // Average frame time
}

export interface TimingThresholds {
  touchToResponse: number; // Max acceptable latency from touch to response (ms)
  totalDuration: number; // Max acceptable total gesture duration (ms)
  maxFrameDrops: number; // Max acceptable frame drops
  peakLatency: number; // Max acceptable peak latency per frame (ms)
  targetFPS: number; // Target FPS (usually 60)
}

// Platform-specific timing thresholds
export const DEFAULT_THRESHOLDS: Record<Platform, TimingThresholds> = {
  ios: {
    touchToResponse: 100, // iOS: 100ms is imperceptible
    totalDuration: 500, // iOS animations typically 250-400ms
    maxFrameDrops: 2, // iOS: 60 FPS, 2 drops tolerated
    peakLatency: 16.67, // 60 FPS = 16.67ms per frame
    targetFPS: 60,
  },
  android: {
    touchToResponse: 150, // Android: 150ms threshold (slightly more forgiving)
    totalDuration: 600, // Android: 300-500ms typical
    maxFrameDrops: 3, // Android: more variation tolerated
    peakLatency: 16.67, // Target 60 FPS
    targetFPS: 60,
  },
};

export class GestureTimingValidator {
  private thresholds: TimingThresholds;
  private platform: Platform;

  constructor(platform: Platform, customThresholds?: Partial<TimingThresholds>) {
    this.platform = platform;
    this.thresholds = {
      ...DEFAULT_THRESHOLDS[platform],
      ...customThresholds,
    };
  }

  /**
   * Validate gesture timing metrics against thresholds.
   * Returns array of violations for detailed reporting.
   */
  validate(metrics: GestureTimingMetrics): GestureTimingViolation[] {
    const violations: GestureTimingViolation[] = [];

    if (metrics.touchDownToResponseMs > this.thresholds.touchToResponse) {
      violations.push({
        type: 'touch-response-latency',
        actual: metrics.touchDownToResponseMs,
        threshold: this.thresholds.touchToResponse,
        severity: metrics.touchDownToResponseMs > this.thresholds.touchToResponse * 1.5 ? 'critical' : 'warning',
      });
    }

    if (metrics.totalDurationMs > this.thresholds.totalDuration) {
      violations.push({
        type: 'gesture-duration',
        actual: metrics.totalDurationMs,
        threshold: this.thresholds.totalDuration,
        severity: 'warning',
      });
    }

    if (metrics.frameDrops > this.thresholds.maxFrameDrops) {
      violations.push({
        type: 'frame-drops',
        actual: metrics.frameDrops,
        threshold: this.thresholds.maxFrameDrops,
        severity: metrics.frameDrops > this.thresholds.maxFrameDrops * 2 ? 'critical' : 'warning',
      });
    }

    if (metrics.peakLatencyMs > this.thresholds.peakLatency) {
      violations.push({
        type: 'peak-latency',
        actual: metrics.peakLatencyMs,
        threshold: this.thresholds.peakLatency,
        severity: 'warning',
      });
    }

    return violations;
  }

  /**
   * Check if gesture timing is acceptable (no critical violations).
   */
  isAcceptable(metrics: GestureTimingMetrics): boolean {
    const violations = this.validate(metrics);
    return !violations.some(v => v.severity === 'critical');
  }

  /**
   * Get a score 0-100 based on timing performance.
   * 100 = all metrics within thresholds, 0 = severe violations.
   */
  scorePerformance(metrics: GestureTimingMetrics): number {
    let score = 100;

    // Deduct for touch-to-response latency (0-40 points)
    const responseLatencyRatio = metrics.touchDownToResponseMs / this.thresholds.touchToResponse;
    if (responseLatencyRatio > 1) {
      score -= Math.min(40, (responseLatencyRatio - 1) * 20);
    }

    // Deduct for frame drops (0-30 points)
    const frameDropRatio = metrics.frameDrops / this.thresholds.maxFrameDrops;
    if (frameDropRatio > 1) {
      score -= Math.min(30, (frameDropRatio - 1) * 15);
    }

    // Deduct for peak latency (0-20 points)
    const peakLatencyRatio = metrics.peakLatencyMs / this.thresholds.peakLatency;
    if (peakLatencyRatio > 1) {
      score -= Math.min(20, (peakLatencyRatio - 1) * 10);
    }

    // Deduct for gesture duration (0-10 points)
    const durationRatio = metrics.totalDurationMs / this.thresholds.totalDuration;
    if (durationRatio > 1) {
      score -= Math.min(10, (durationRatio - 1) * 5);
    }

    return Math.max(0, Math.round(score));
  }
}

export interface GestureTimingViolation {
  type: 'touch-response-latency' | 'gesture-duration' | 'frame-drops' | 'peak-latency';
  actual: number;
  threshold: number;
  severity: 'warning' | 'critical';
}

/**
 * Calculate frame drop count from frame time metrics.
 * Assumes 60 FPS target (16.67ms per frame).
 */
export function calculateFrameDrops(frameTimes: number[]): number {
  const targetFrameTime = 16.67; // 60 FPS
  const tolerance = 2; // Allow 2ms variance
  return frameTimes.filter(time => time > targetFrameTime + tolerance).length;
}

/**
 * Calculate average frame time from frame times array (ms).
 */
export function calculateAverageFrameTime(frameTimes: number[]): number {
  if (frameTimes.length === 0) return 0;
  return frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length;
}

/**
 * Helper to build GestureTimingMetrics from raw timing data.
 */
export function buildMetrics(data: {
  gestureType: GestureType;
  platform: Platform;
  touchDownMs: number;
  responseStartMs: number;
  gestureEndMs: number;
  frameTimes: number[]; // Array of frame render times in ms
}): GestureTimingMetrics {
  const frameDrops = calculateFrameDrops(data.frameTimes);
  const avgFrameTime = calculateAverageFrameTime(data.frameTimes);

  return {
    gestureType: data.gestureType,
    platform: data.platform,
    touchDownToResponseMs: data.responseStartMs - data.touchDownMs,
    totalDurationMs: data.gestureEndMs - data.touchDownMs,
    frameDrops,
    peakLatencyMs: Math.max(...data.frameTimes),
    avgFrameTimeMs: avgFrameTime,
  };
}
