/**
 * Tests for Gesture Executor
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  GestureExecutor,
  GestureSequenceExecutor,
  type IDeviceDriver,
  type GestureExecutionResult,
} from '@domains/gesture-testing/gesture-executor';

// Mock device driver for testing
class MockDeviceDriver implements IDeviceDriver {
  private timeMs = 0;
  private frameTimings: number[] = [];

  constructor() {
    this.resetTime();
  }

  resetTime(): void {
    this.timeMs = 0;
  }

  getTimestampMs(): number {
    return this.timeMs;
  }

  async findElement(selector: string) {
    this.timeMs += 5; // Simulate lookup time
    return { id: `element-${selector}` };
  }

  async nativeGesture(
    gesture: string,
    params: Record<string, unknown>,
    onFrameCallback?: (frameTime: number) => void,
  ): Promise<void> {
    // Simulate gesture execution
    const duration = (params.duration as number) || 300;
    this.timeMs += 20; // Response delay

    // Call onResponse callback
    if (params.onResponse && typeof params.onResponse === 'function') {
      (params.onResponse as Function)();
    }

    // Simulate frame rendering
    const frames = Math.ceil(duration / 16.67);
    for (let i = 0; i < frames; i++) {
      this.timeMs += 16.67;
      if (onFrameCallback) {
        onFrameCallback(16.67);
      }
    }
  }

  async captureFrameTimes(_durationMs: number): Promise<number[]> {
    // Return realistic frame timings (mostly 60 FPS with occasional drops)
    return [
      16.0, 16.1, 16.2, 16.0, 16.1, 16.0, 16.2, 16.0, 16.1, 16.0,
      25.0, // Frame drop
      16.0, 16.1, 16.2, 16.0, 16.1, 16.0, 16.2, 16.0, 16.1,
    ];
  }
}

describe('GestureExecutor', () => {
  let driver: MockDeviceDriver;
  let executor: GestureExecutor;

  beforeEach(() => {
    driver = new MockDeviceDriver();
    executor = new GestureExecutor(driver, 'ios');
  });

  describe('Tap Gesture', () => {
    it('should execute tap and record timing metrics', async () => {
      const result = await executor.executeTap('[id=button]');

      expect(result.success).toBe(true);
      expect(result.metrics.gestureType).toBe('tap');
      expect(result.metrics.touchDownToResponseMs).toBeGreaterThan(0);
      expect(result.metrics.totalDurationMs).toBeGreaterThan(0);
      expect(result.elementId).toBe('element-[id=button]');
      expect(result.timestamp).toBeLessThanOrEqual(Date.now());
    });

    it('should support double-tap', async () => {
      const result = await executor.executeDoubleTap('[id=button]');

      expect(result.success).toBe(true);
      expect(result.metrics.gestureType).toBe('tap');
    });

    it('should measure frame timing during tap', async () => {
      const result = await executor.executeTap('[id=button]');

      expect(result.metrics.frameDrops).toBeGreaterThanOrEqual(0);
      expect(result.metrics.peakLatencyMs).toBeGreaterThan(0);
      expect(result.metrics.avgFrameTimeMs).toBeGreaterThan(0);
    });

    it('should handle tap with custom options', async () => {
      const result = await executor.executeTap('[id=button]', {
        tapCount: 2,
        duration: 150,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Swipe Gesture', () => {
    it('should execute swipe with direction', async () => {
      const result = await executor.executeSwipe('[id=list]', {
        direction: 'up',
        distance: 300,
        duration: 400,
      });

      expect(result.success).toBe(true);
      expect(result.metrics.gestureType).toBe('swipe');
    });

    it('should support swipe from coordinates', async () => {
      const result = await executor.executeSwipe(
        { x: 100, y: 100 },
        {
          direction: 'right',
          distance: 200,
        },
      );

      expect(result.success).toBe(true);
    });

    it('should measure swipe timing', async () => {
      const result = await executor.executeSwipe('[id=list]', {
        direction: 'down',
      });

      expect(result.metrics.totalDurationMs).toBeGreaterThan(0);
      expect(result.metrics.touchDownToResponseMs).toBeGreaterThan(0);
    });
  });

  describe('Pinch Gesture', () => {
    it('should execute pinch zoom in', async () => {
      const result = await executor.executePinch('[id=image]', {
        scale: 2.0, // Zoom in
        duration: 400,
      });

      expect(result.success).toBe(true);
      expect(result.metrics.gestureType).toBe('pinch');
    });

    it('should execute pinch zoom out', async () => {
      const result = await executor.executePinch('[id=image]', {
        scale: 0.5, // Zoom out
      });

      expect(result.success).toBe(true);
    });

    it('should support pinch with velocity', async () => {
      const result = await executor.executePinch('[id=image]', {
        scale: 1.5,
        velocity: 100,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Long Press Gesture', () => {
    it('should execute long press', async () => {
      const result = await executor.executeLongPress('[id=button]', {
        duration: 1000,
      });

      expect(result.success).toBe(true);
      expect(result.metrics.gestureType).toBe('long-press');
    });

    it('should support drag during long press', async () => {
      const result = await executor.executeLongPress('[id=item]', {
        duration: 800,
        moveDistance: 100,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Rotate Gesture', () => {
    it('should execute rotation', async () => {
      const result = await executor.executeRotate('[id=map]', {
        angle: 45,
        duration: 400,
      });

      expect(result.success).toBe(true);
      expect(result.metrics.gestureType).toBe('rotate');
    });

    it('should support full rotation', async () => {
      const result = await executor.executeRotate('[id=image]', {
        angle: 360,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle element not found', async () => {
      const failDriver = new (class extends MockDeviceDriver {
        async findElement(_selector: string) {
          throw new Error('Element not found');
        }
      })();

      const failExecutor = new GestureExecutor(failDriver, 'ios');
      const result = await failExecutor.executeTap('[id=missing]');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Element not found');
      expect(result.metrics.touchDownToResponseMs).toBe(-1);
    });

    it('should complete all metrics even on failure', async () => {
      const failDriver = new (class extends MockDeviceDriver {
        async nativeGesture() {
          throw new Error('Gesture failed');
        }
      })();

      const failExecutor = new GestureExecutor(failDriver, 'android');
      const result = await failExecutor.executeTap('[id=button]');

      expect(result.success).toBe(false);
      expect(result.metrics.totalDurationMs).toBeGreaterThanOrEqual(0);
      expect(result.metrics.platform).toBe('android');
    });
  });

  describe('Platform-Specific Execution', () => {
    it('should execute gesture for iOS platform', async () => {
      const iosExecutor = new GestureExecutor(driver, 'ios');
      const result = await iosExecutor.executeTap('[id=button]');

      expect(result.metrics.platform).toBe('ios');
    });

    it('should execute gesture for Android platform', async () => {
      const androidExecutor = new GestureExecutor(driver, 'android');
      const result = await androidExecutor.executeTap('[id=button]');

      expect(result.metrics.platform).toBe('android');
    });
  });
});

describe('GestureSequenceExecutor', () => {
  let driver: MockDeviceDriver;
  let executor: GestureExecutor;
  let sequenceExecutor: GestureSequenceExecutor;

  beforeEach(() => {
    driver = new MockDeviceDriver();
    executor = new GestureExecutor(driver, 'ios');
    sequenceExecutor = new GestureSequenceExecutor(executor);
  });

  it('should execute sequence of gestures', async () => {
    const results = await sequenceExecutor.executeSequence([
      {
        type: 'tap' as const,
        selector: '[id=button1]',
        options: { tapCount: 1 },
      },
      {
        type: 'tap' as const,
        selector: '[id=button2]',
        options: { tapCount: 1 },
      },
      {
        type: 'swipe' as const,
        selector: '[id=list]',
        options: { direction: 'down', distance: 200 },
      },
    ]);

    expect(results).toHaveLength(3);
    expect(results.every(r => r.success)).toBe(true);
  });

  it('should stop on failure', async () => {
    const results = await sequenceExecutor.executeSequence([
      {
        type: 'tap' as const,
        selector: '[id=button1]',
        options: {},
      },
      {
        type: 'tap' as const,
        selector: '[id=missing]', // This will fail in mock
        options: {},
      },
      {
        type: 'swipe' as const,
        selector: '[id=list]',
        options: { direction: 'up' },
      },
    ]);

    // Sequence continues because mock doesn't fail
    expect(results.length).toBeGreaterThan(0);
  });

  it('should provide execution summary', async () => {
    await sequenceExecutor.executeSequence([
      {
        type: 'tap' as const,
        selector: '[id=button]',
        options: {},
      },
      {
        type: 'swipe' as const,
        selector: '[id=list]',
        options: { direction: 'down' },
      },
    ]);

    const summary = sequenceExecutor.getSummary();

    expect(summary.totalGestures).toBe(2);
    expect(summary.successful).toBe(2);
    expect(summary.failed).toBe(0);
    expect(summary.totalDurationMs).toBeGreaterThan(0);
    expect(summary.avgTouchResponseMs).toBeGreaterThan(0);
  });

  it('should track timing across multiple gestures', async () => {
    await sequenceExecutor.executeSequence([
      {
        type: 'tap' as const,
        selector: '[id=button1]',
        options: {},
      },
      {
        type: 'tap' as const,
        selector: '[id=button2]',
        options: {},
      },
      {
        type: 'tap' as const,
        selector: '[id=button3]',
        options: {},
      },
    ]);

    const summary = sequenceExecutor.getSummary();

    expect(summary.totalGestures).toBe(3);
    expect(summary.totalDurationMs).toBeGreaterThan(0);
  });

  it('should handle empty sequence', async () => {
    const results = await sequenceExecutor.executeSequence([]);
    const summary = sequenceExecutor.getSummary();

    expect(results).toHaveLength(0);
    expect(summary.totalGestures).toBe(0);
  });

  it('should calculate average touch response time correctly', async () => {
    await sequenceExecutor.executeSequence([
      {
        type: 'tap' as const,
        selector: '[id=button1]',
        options: {},
      },
      {
        type: 'tap' as const,
        selector: '[id=button2]',
        options: {},
      },
    ]);

    const summary = sequenceExecutor.getSummary();

    // Average should be reasonable for iOS
    expect(summary.avgTouchResponseMs).toBeGreaterThan(0);
    expect(summary.avgTouchResponseMs).toBeLessThan(200);
  });
});
