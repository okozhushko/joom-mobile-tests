/**
 * Tests for Gesture Timing Validator
 */
import { describe, it, expect } from 'vitest';
import {
  GestureTimingValidator,
  DEFAULT_THRESHOLDS,
  calculateFrameDrops,
  calculateAverageFrameTime,
  buildMetrics,
  type GestureTimingMetrics,
} from '@domains/gesture-testing/gesture-timing-validator';

describe('GestureTimingValidator', () => {
  describe('iOS Timing Validation', () => {
    const validator = new GestureTimingValidator('ios');

    it('should accept tap with good timing metrics', () => {
      const metrics: GestureTimingMetrics = {
        gestureType: 'tap',
        platform: 'ios',
        touchDownToResponseMs: 50, // Well within 100ms threshold
        totalDurationMs: 250,
        frameDrops: 0,
        peakLatencyMs: 16.67,
        avgFrameTimeMs: 16.0,
      };

      const violations = validator.validate(metrics);
      expect(violations).toHaveLength(0);
      expect(validator.isAcceptable(metrics)).toBe(true);
    });

    it('should reject tap with high latency', () => {
      const metrics: GestureTimingMetrics = {
        gestureType: 'tap',
        platform: 'ios',
        touchDownToResponseMs: 200, // Exceeds 100ms threshold
        totalDurationMs: 250,
        frameDrops: 0,
        peakLatencyMs: 16.67,
        avgFrameTimeMs: 16.0,
      };

      const violations = validator.validate(metrics);
      expect(violations.length).toBeGreaterThan(0);
      const latencyViolation = violations.find(v => v.type === 'touch-response-latency');
      expect(latencyViolation).toBeDefined();
      expect(latencyViolation!.severity).toBe('critical');
    });

    it('should warn on frame drops', () => {
      const metrics: GestureTimingMetrics = {
        gestureType: 'tap',
        platform: 'ios',
        touchDownToResponseMs: 80,
        totalDurationMs: 250,
        frameDrops: 3, // Exceeds iOS threshold of 2
        peakLatencyMs: 16.67,
        avgFrameTimeMs: 16.0,
      };

      const violations = validator.validate(metrics);
      const dropViolation = violations.find(v => v.type === 'frame-drops');
      expect(dropViolation).toBeDefined();
      expect(dropViolation!.severity).toBe('warning');
    });

    it('should score perfect metrics as 100', () => {
      const metrics: GestureTimingMetrics = {
        gestureType: 'swipe',
        platform: 'ios',
        touchDownToResponseMs: 75,
        totalDurationMs: 300,
        frameDrops: 0,
        peakLatencyMs: 16.0,
        avgFrameTimeMs: 16.0,
      };

      const score = validator.scorePerformance(metrics);
      expect(score).toBe(100);
    });

    it('should deduct score for high latency', () => {
      const metrics: GestureTimingMetrics = {
        gestureType: 'tap',
        platform: 'ios',
        touchDownToResponseMs: 150, // 50% over threshold
        totalDurationMs: 250,
        frameDrops: 0,
        peakLatencyMs: 16.67,
        avgFrameTimeMs: 16.0,
      };

      const score = validator.scorePerformance(metrics);
      expect(score).toBeLessThan(100);
      expect(score).toBeGreaterThan(50); // Should still be acceptable range
    });

    it('should deduct score proportionally for multiple violations', () => {
      const metrics: GestureTimingMetrics = {
        gestureType: 'tap',
        platform: 'ios',
        touchDownToResponseMs: 250, // 150% over threshold
        totalDurationMs: 1000, // 100% over threshold
        frameDrops: 8, // 300% over threshold
        peakLatencyMs: 25.0, // 50% over threshold
        avgFrameTimeMs: 20.0,
      };

      const score = validator.scorePerformance(metrics);
      expect(score).toBeLessThan(50); // Multiple large deductions
      expect(score).toBeGreaterThan(0); // Still not completely failed
    });
  });

  describe('Android Timing Validation', () => {
    const validator = new GestureTimingValidator('android');

    it('should have more lenient thresholds than iOS', () => {
      const androidThresholds = DEFAULT_THRESHOLDS.android;
      const iosThresholds = DEFAULT_THRESHOLDS.ios;

      expect(androidThresholds.touchToResponse).toBeGreaterThan(iosThresholds.touchToResponse);
      expect(androidThresholds.totalDuration).toBeGreaterThan(iosThresholds.totalDuration);
      expect(androidThresholds.maxFrameDrops).toBeGreaterThan(iosThresholds.maxFrameDrops);
    });

    it('should accept metrics within Android thresholds', () => {
      const metrics: GestureTimingMetrics = {
        gestureType: 'tap',
        platform: 'android',
        touchDownToResponseMs: 130, // Within Android 150ms threshold
        totalDurationMs: 550, // Within Android 600ms threshold
        frameDrops: 2,
        peakLatencyMs: 16.67,
        avgFrameTimeMs: 16.5,
      };

      expect(validator.isAcceptable(metrics)).toBe(true);
    });
  });

  describe('Custom Thresholds', () => {
    it('should apply custom thresholds', () => {
      const customValidator = new GestureTimingValidator('ios', {
        touchToResponse: 200, // Override default 100ms
      });

      const metrics: GestureTimingMetrics = {
        gestureType: 'tap',
        platform: 'ios',
        touchDownToResponseMs: 180, // Would fail with default, pass with custom
        totalDurationMs: 250,
        frameDrops: 0,
        peakLatencyMs: 16.67,
        avgFrameTimeMs: 16.0,
      };

      const violations = customValidator.validate(metrics);
      expect(violations.every(v => v.type !== 'touch-response-latency')).toBe(true);
    });
  });

  describe('Frame Drop Calculation', () => {
    it('should count frames exceeding target time', () => {
      const frameTimes = [
        16.0, 16.1, 16.2, // Good frames
        25.0, // Dropped frame
        16.0, 16.1, // Recovery
        30.0, 32.0, // Multiple drops
        16.0,
      ];

      const drops = calculateFrameDrops(frameTimes);
      expect(drops).toBe(3); // Only frames >18.67ms (16.67 + 2ms tolerance)
    });

    it('should return 0 for perfect frames', () => {
      const frameTimes = Array(60).fill(16.67);
      const drops = calculateFrameDrops(frameTimes);
      expect(drops).toBe(0);
    });

    it('should handle empty array', () => {
      const drops = calculateFrameDrops([]);
      expect(drops).toBe(0);
    });
  });

  describe('Average Frame Time Calculation', () => {
    it('should calculate average correctly', () => {
      const frameTimes = [16.0, 16.5, 17.0, 16.2];
      const avg = calculateAverageFrameTime(frameTimes);
      expect(avg).toBeCloseTo(16.425, 2);
    });

    it('should handle empty array', () => {
      const avg = calculateAverageFrameTime([]);
      expect(avg).toBe(0);
    });

    it('should handle single frame', () => {
      const avg = calculateAverageFrameTime([16.67]);
      expect(avg).toBe(16.67);
    });
  });

  describe('Metrics Building', () => {
    it('should build metrics from raw timing data', () => {
      const metrics = buildMetrics({
        gestureType: 'tap',
        platform: 'ios',
        touchDownMs: 0,
        responseStartMs: 80,
        gestureEndMs: 250,
        frameTimes: Array(15).fill(16.0).concat([25.0, 26.0]), // 2 dropped frames
      });

      expect(metrics.gestureType).toBe('tap');
      expect(metrics.touchDownToResponseMs).toBe(80);
      expect(metrics.totalDurationMs).toBe(250);
      expect(metrics.frameDrops).toBe(2);
      expect(metrics.avgFrameTimeMs).toBeGreaterThan(16);
    });

    it('should calculate peak latency from frame times', () => {
      const metrics = buildMetrics({
        gestureType: 'swipe',
        platform: 'android',
        touchDownMs: 100,
        responseStartMs: 150,
        gestureEndMs: 400,
        frameTimes: [16.0, 16.5, 35.0, 16.2], // Peak = 35.0
      });

      expect(metrics.peakLatencyMs).toBe(35.0);
    });
  });

  describe('Gesture Type Validation', () => {
    const validator = new GestureTimingValidator('ios');

    it('should validate different gesture types', () => {
      const gestureTypes = ['tap', 'swipe', 'pinch', 'long-press', 'double-tap', 'rotate'] as const;

      gestureTypes.forEach(type => {
        const metrics: GestureTimingMetrics = {
          gestureType: type,
          platform: 'ios',
          touchDownToResponseMs: 75,
          totalDurationMs: 250,
          frameDrops: 0,
          peakLatencyMs: 16.67,
          avgFrameTimeMs: 16.0,
        };

        const violations = validator.validate(metrics);
        expect(violations).toHaveLength(0);
      });
    });
  });

  describe('Violation Severity', () => {
    const validator = new GestureTimingValidator('ios');

    it('should mark critical violations for extreme latency', () => {
      const metrics: GestureTimingMetrics = {
        gestureType: 'tap',
        platform: 'ios',
        touchDownToResponseMs: 250, // 150% over threshold
        totalDurationMs: 250,
        frameDrops: 0,
        peakLatencyMs: 16.67,
        avgFrameTimeMs: 16.0,
      };

      const violations = validator.validate(metrics);
      const critical = violations.filter(v => v.severity === 'critical');
      expect(critical.length).toBeGreaterThan(0);
    });

    it('should mark warning for moderate violations', () => {
      const metrics: GestureTimingMetrics = {
        gestureType: 'tap',
        platform: 'ios',
        touchDownToResponseMs: 120, // Slightly over threshold
        totalDurationMs: 250,
        frameDrops: 0,
        peakLatencyMs: 16.67,
        avgFrameTimeMs: 16.0,
      };

      const violations = validator.validate(metrics);
      const warnings = violations.filter(v => v.severity === 'warning');
      expect(warnings.length).toBeGreaterThan(0);
    });
  });
});
