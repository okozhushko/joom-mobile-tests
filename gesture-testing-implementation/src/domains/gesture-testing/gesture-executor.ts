/**
 * Gesture Executor with Timing Instrumentation
 *
 * Executes mobile gestures while measuring precise timing metrics.
 * Integrates with platform-specific test drivers (Appium, etc).
 *
 * @module gesture-testing/executor
 */

import type { GestureType, Platform, GestureTimingMetrics } from './gesture-timing-validator.js';
import { buildMetrics } from './gesture-timing-validator.js';

export interface GestureExecutionResult {
  success: boolean;
  metrics: GestureTimingMetrics;
  error?: string;
  elementId?: string;
  timestamp: number;
}

export interface GestureCoordinates {
  x: number;
  y: number;
}

export interface TapGestureOptions {
  tapCount?: number;
  duration?: number; // ms
}

export interface SwipeGestureOptions {
  direction: 'up' | 'down' | 'left' | 'right';
  distance?: number; // pixels
  duration?: number; // ms
}

export interface PinchGestureOptions {
  scale: number; // 0.5 = half size, 2.0 = double size
  duration?: number; // ms
  velocity?: number; // pixels/sec
}

export interface LongPressGestureOptions {
  duration: number; // ms, typically 500-1000
  moveDistance?: number; // px, optional drag distance
}

export interface RotateGestureOptions {
  angle: number; // degrees
  duration?: number; // ms
}

/**
 * Platform-agnostic interface for device drivers.
 * Implementations: AppiumDriver, DetoxDriver, UIAutomatorDriver, etc.
 */
export interface IDeviceDriver {
  findElement(selector: string): Promise<{ id: string }>;
  getTimestampMs(): number;
  captureFrameTimes(durationMs: number): Promise<number[]>;
  // Platform-specific gesture methods - must record timing
  nativeGesture(
    gesture: GestureType,
    params: Record<string, unknown>,
    onFrameCallback?: (frameTime: number) => void,
  ): Promise<void>;
}

/**
 * Gesture executor with timing instrumentation.
 * Measures latency from input to visual response.
 */
export class GestureExecutor {
  private driver: IDeviceDriver;
  private platform: Platform;
  private frameTimings: number[] = [];

  constructor(driver: IDeviceDriver, platform: Platform) {
    this.driver = driver;
    this.platform = platform;
  }

  /**
   * Execute a tap gesture with timing measurement.
   */
  async executeTap(selector: string, options: TapGestureOptions = {}): Promise<GestureExecutionResult> {
    const startTime = this.driver.getTimestampMs();
    let responseTime = 0;
    let endTime = 0;

    try {
      const element = await this.driver.findElement(selector);

      // Start frame timing capture
      const frameCapture = this.captureFrameTimingsAsync();

      // Execute tap
      await this.driver.nativeGesture('tap', {
        elementId: element.id,
        tapCount: options.tapCount ?? 1,
        duration: options.duration ?? 100,
        onResponse: () => {
          responseTime = this.driver.getTimestampMs();
        },
      });

      endTime = this.driver.getTimestampMs();
      const frameTimes = await frameCapture;

      return {
        success: true,
        metrics: buildMetrics({
          gestureType: 'tap',
          platform: this.platform,
          touchDownMs: startTime,
          responseStartMs: responseTime,
          gestureEndMs: endTime,
          frameTimes,
        }),
        elementId: element.id,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metrics: this.buildErrorMetrics('tap', startTime),
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Execute a swipe gesture with timing measurement.
   */
  async executeSwipe(
    selector: string | GestureCoordinates,
    options: SwipeGestureOptions,
  ): Promise<GestureExecutionResult> {
    const startTime = this.driver.getTimestampMs();
    let responseTime = 0;
    let endTime = 0;

    try {
      let startCoords = typeof selector === 'string' ? null : selector;

      if (typeof selector === 'string') {
        const element = await this.driver.findElement(selector);
        // In real implementation, get element coordinates
        startCoords = { x: 100, y: 100 };
      }

      const frameCapture = this.captureFrameTimingsAsync();

      await this.driver.nativeGesture('swipe', {
        startCoords,
        direction: options.direction,
        distance: options.distance ?? 200,
        duration: options.duration ?? 300,
        onResponse: () => {
          responseTime = this.driver.getTimestampMs();
        },
      });

      endTime = this.driver.getTimestampMs();
      const frameTimes = await frameCapture;

      return {
        success: true,
        metrics: buildMetrics({
          gestureType: 'swipe',
          platform: this.platform,
          touchDownMs: startTime,
          responseStartMs: responseTime,
          gestureEndMs: endTime,
          frameTimes,
        }),
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metrics: this.buildErrorMetrics('swipe', startTime),
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Execute a pinch gesture with timing measurement (zoom in/out).
   */
  async executePinch(selector: string, options: PinchGestureOptions): Promise<GestureExecutionResult> {
    const startTime = this.driver.getTimestampMs();
    let responseTime = 0;
    let endTime = 0;

    try {
      const element = await this.driver.findElement(selector);
      const frameCapture = this.captureFrameTimingsAsync();

      await this.driver.nativeGesture('pinch', {
        elementId: element.id,
        scale: options.scale,
        duration: options.duration ?? 400,
        velocity: options.velocity,
        onResponse: () => {
          responseTime = this.driver.getTimestampMs();
        },
      });

      endTime = this.driver.getTimestampMs();
      const frameTimes = await frameCapture;

      return {
        success: true,
        metrics: buildMetrics({
          gestureType: 'pinch',
          platform: this.platform,
          touchDownMs: startTime,
          responseStartMs: responseTime,
          gestureEndMs: endTime,
          frameTimes,
        }),
        elementId: element.id,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metrics: this.buildErrorMetrics('pinch', startTime),
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Execute a long-press gesture (hold for duration).
   */
  async executeLongPress(selector: string, options: LongPressGestureOptions): Promise<GestureExecutionResult> {
    const startTime = this.driver.getTimestampMs();
    let responseTime = 0;
    let endTime = 0;

    try {
      const element = await this.driver.findElement(selector);
      const frameCapture = this.captureFrameTimingsAsync();

      await this.driver.nativeGesture('long-press', {
        elementId: element.id,
        duration: options.duration,
        moveDistance: options.moveDistance,
        onResponse: () => {
          responseTime = this.driver.getTimestampMs();
        },
      });

      endTime = this.driver.getTimestampMs();
      const frameTimes = await frameCapture;

      return {
        success: true,
        metrics: buildMetrics({
          gestureType: 'long-press',
          platform: this.platform,
          touchDownMs: startTime,
          responseStartMs: responseTime,
          gestureEndMs: endTime,
          frameTimes,
        }),
        elementId: element.id,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metrics: this.buildErrorMetrics('long-press', startTime),
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Execute a double-tap gesture.
   */
  async executeDoubleTap(selector: string, options: TapGestureOptions = {}): Promise<GestureExecutionResult> {
    return this.executeTap(selector, { ...options, tapCount: 2 });
  }

  /**
   * Execute a rotation gesture (for maps, images, etc).
   */
  async executeRotate(selector: string, options: RotateGestureOptions): Promise<GestureExecutionResult> {
    const startTime = this.driver.getTimestampMs();
    let responseTime = 0;
    let endTime = 0;

    try {
      const element = await this.driver.findElement(selector);
      const frameCapture = this.captureFrameTimingsAsync();

      await this.driver.nativeGesture('rotate', {
        elementId: element.id,
        angle: options.angle,
        duration: options.duration ?? 400,
        onResponse: () => {
          responseTime = this.driver.getTimestampMs();
        },
      });

      endTime = this.driver.getTimestampMs();
      const frameTimes = await frameCapture;

      return {
        success: true,
        metrics: buildMetrics({
          gestureType: 'rotate',
          platform: this.platform,
          touchDownMs: startTime,
          responseStartMs: responseTime,
          gestureEndMs: endTime,
          frameTimes,
        }),
        elementId: element.id,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metrics: this.buildErrorMetrics('rotate', startTime),
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Capture frame timings asynchronously during gesture execution.
   */
  private async captureFrameTimingsAsync(): Promise<number[]> {
    // This runs in parallel with gesture execution
    // Duration estimate: average gesture is 200-500ms
    return this.driver.captureFrameTimes(500);
  }

  /**
   * Build error metrics when gesture fails.
   */
  private buildErrorMetrics(gestureType: GestureType, startTime: number): GestureTimingMetrics {
    return {
      gestureType,
      platform: this.platform,
      touchDownToResponseMs: -1,
      totalDurationMs: this.driver.getTimestampMs() - startTime,
      frameDrops: 0,
      peakLatencyMs: 0,
      avgFrameTimeMs: 0,
    };
  }
}

/**
 * Multi-gesture sequence executor for complex interactions.
 */
export class GestureSequenceExecutor {
  private executor: GestureExecutor;
  private results: GestureExecutionResult[] = [];

  constructor(executor: GestureExecutor) {
    this.executor = executor;
  }

  /**
   * Execute sequence of gestures and return all timing metrics.
   */
  async executeSequence(
    gestures: Array<{
      type: GestureType;
      selector: string;
      options: Record<string, unknown>;
    }>,
  ): Promise<GestureExecutionResult[]> {
    this.results = [];

    for (const gesture of gestures) {
      let result: GestureExecutionResult;

      switch (gesture.type) {
        case 'tap':
          result = await this.executor.executeTap(gesture.selector, gesture.options as any);
          break;
        case 'swipe':
          result = await this.executor.executeSwipe(gesture.selector, gesture.options as any);
          break;
        case 'pinch':
          result = await this.executor.executePinch(gesture.selector, gesture.options as any);
          break;
        case 'long-press':
          result = await this.executor.executeLongPress(gesture.selector, gesture.options as any);
          break;
        case 'double-tap':
          result = await this.executor.executeDoubleTap(gesture.selector, gesture.options as any);
          break;
        case 'rotate':
          result = await this.executor.executeRotate(gesture.selector, gesture.options as any);
          break;
      }

      this.results.push(result);

      // Stop sequence on failure
      if (!result.success) {
        break;
      }
    }

    return this.results;
  }

  /**
   * Get summary of sequence execution.
   */
  getSummary(): {
    totalGestures: number;
    successful: number;
    failed: number;
    totalDurationMs: number;
    avgTouchResponseMs: number;
  } {
    const successful = this.results.filter(r => r.success).length;
    const failed = this.results.length - successful;
    const totalDuration = this.results.reduce((sum, r) => sum + r.metrics.totalDurationMs, 0);
    const validResults = this.results.filter(r => r.metrics.touchDownToResponseMs > 0);
    const avgTouchResponse =
      validResults.length > 0
        ? validResults.reduce((sum, r) => sum + r.metrics.touchDownToResponseMs, 0) / validResults.length
        : 0;

    return {
      totalGestures: this.results.length,
      successful,
      failed,
      totalDurationMs: totalDuration,
      avgTouchResponseMs: avgTouchResponse,
    };
  }
}
