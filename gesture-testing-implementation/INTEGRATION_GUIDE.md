# Integration Guide - Gesture Timing Validation

## Quick Start (5 minutes)

### Step 1: Copy Files to Your Project

```bash
# Copy source files
cp -r gesture-testing-implementation/src/domains/gesture-testing \
  your-project/src/domains/

# Copy test files
cp -r gesture-testing-implementation/tests/domains/gesture-testing \
  your-project/tests/domains/
```

### Step 2: Update domains/index.ts

Add this export to your `src/domains/index.ts`:

```typescript
// Add with other domain exports
export * as GestureTesting from './gesture-testing/index';
```

### Step 3: Basic Usage

```typescript
import {
  GestureExecutor,
  GestureTimingValidator,
} from '@domains/gesture-testing';

// Create executor (pass your Appium driver or similar)
const executor = new GestureExecutor(driver, 'ios');
const validator = new GestureTimingValidator('ios');

// Execute tap and measure
const result = await executor.executeTap('[id=button]');

// Validate performance
if (validator.isAcceptable(result.metrics)) {
  console.log('✅ Gesture timing acceptable');
} else {
  const violations = validator.validate(result.metrics);
  console.error('❌ Performance violations:', violations);
}
```

---

## Integration Patterns

### Pattern 1: Single Gesture Testing

```typescript
async function testTapPerformance(driver: IDeviceDriver) {
  const executor = new GestureExecutor(driver, 'ios');
  const validator = new GestureTimingValidator('ios');

  const result = await executor.executeTap('[id=submit-button]');
  
  if (!result.success) {
    throw new Error(`Tap failed: ${result.error}`);
  }

  const score = validator.scorePerformance(result.metrics);
  console.log(`Gesture performance score: ${score}/100`);
  
  return {
    success: true,
    metrics: result.metrics,
    score,
  };
}
```

### Pattern 2: Gesture Sequence (Complex Flow)

```typescript
async function testLoginFlow(driver: IDeviceDriver) {
  const executor = new GestureExecutor(driver, 'android');
  const sequenceExecutor = new GestureSequenceExecutor(executor);

  const results = await sequenceExecutor.executeSequence([
    {
      type: 'tap',
      selector: '[id=email-input]',
      options: { tapCount: 1 },
    },
    {
      type: 'tap',
      selector: '[id=password-input]',
      options: { tapCount: 1 },
    },
    {
      type: 'tap',
      selector: '[id=login-button]',
      options: {},
    },
  ]);

  const summary = sequenceExecutor.getSummary();
  
  console.log(`Total gestures: ${summary.totalGestures}`);
  console.log(`Successful: ${summary.successful}`);
  console.log(`Avg touch response: ${summary.avgTouchResponseMs}ms`);

  return summary;
}
```

### Pattern 3: Cross-Platform Comparison

```typescript
async function validateCrossPlatformParity(
  iosDriver: IDeviceDriver,
  androidDriver: IDeviceDriver,
) {
  const iosExecutor = new GestureExecutor(iosDriver, 'ios');
  const androidExecutor = new GestureExecutor(androidDriver, 'android');

  const iosResult = await iosExecutor.executeTap('[id=button]');
  const androidResult = await androidExecutor.executeTap('[id=button]');

  const iosValidator = new GestureTimingValidator('ios');
  const androidValidator = new GestureTimingValidator('android');

  const iosScore = iosValidator.scorePerformance(iosResult.metrics);
  const androidScore = androidValidator.scorePerformance(androidResult.metrics);

  const diff = Math.abs(iosScore - androidScore);
  const acceptable = diff < 15; // Allow 15-point difference

  return {
    iosScore,
    androidScore,
    difference: diff,
    acceptable,
  };
}
```

### Pattern 4: Regression Detection

```typescript
async function detectPerformanceRegression(
  driver: IDeviceDriver,
  baseline: GestureTimingMetrics,
) {
  const executor = new GestureExecutor(driver, 'ios');
  const result = await executor.executeTap('[id=button]');

  // Check for 20% regression
  const regressionThreshold = baseline.touchDownToResponseMs * 1.2;
  
  if (result.metrics.touchDownToResponseMs > regressionThreshold) {
    return {
      regression: true,
      baseline: baseline.touchDownToResponseMs,
      current: result.metrics.touchDownToResponseMs,
      degradation: `${(
        (result.metrics.touchDownToResponseMs - baseline.touchDownToResponseMs) /
        baseline.touchDownToResponseMs * 100
      ).toFixed(1)}%`,
    };
  }

  return { regression: false };
}
```

### Pattern 5: Accessibility Testing

```typescript
async function testAccessibilityGestures(driver: IDeviceDriver) {
  // Users with motor impairments need more time
  const validator = new GestureTimingValidator('ios', {
    touchToResponse: 200, // More lenient (default 100ms)
    totalDuration: 2000,  // Allow longer interactions
  });

  const executor = new GestureExecutor(driver, 'ios');
  
  const longPressResult = await executor.executeLongPress(
    '[id=accessibility-menu]',
    { duration: 2000 }
  );

  const violations = validator.validate(longPressResult.metrics);
  
  return {
    acceptable: violations.length === 0,
    violations,
    metrics: longPressResult.metrics,
  };
}
```

---

## Device Driver Implementation

If using Appium or similar framework, implement `IDeviceDriver`:

```typescript
import { IDeviceDriver } from '@domains/gesture-testing';

export class AppiumDriver implements IDeviceDriver {
  private driver: AppiumWebDriverIO.Client;
  private startTime = 0;

  constructor(driver: AppiumWebDriverIO.Client) {
    this.driver = driver;
  }

  getTimestampMs(): number {
    return Date.now() - this.startTime;
  }

  async findElement(selector: string) {
    const element = await this.driver.$(selector);
    return { id: element.elementId };
  }

  async nativeGesture(
    gesture: string,
    params: Record<string, unknown>,
    onFrameCallback?: (frameTime: number) => void,
  ) {
    const startTime = Date.now();
    
    switch (gesture) {
      case 'tap': {
        const elementId = params.elementId as string;
        const element = await this.driver.$(`[id=${elementId}]`);
        await element.click();
        break;
      }
      case 'swipe': {
        const startCoords = params.startCoords as { x: number; y: number };
        const direction = params.direction as string;
        const distance = (params.distance as number) || 200;
        await this.performSwipe(startCoords, direction, distance);
        break;
      }
      // ... implement other gestures
    }
  }

  async captureFrameTimes(durationMs: number): Promise<number[]> {
    // Implement frame timing capture using Appium performance API
    const frameTimes: number[] = [];
    const startTime = Date.now();

    while (Date.now() - startTime < durationMs) {
      // Capture frame metrics from device
      const frameTime = await this.measureFrameTime();
      frameTimes.push(frameTime);
      await new Promise(resolve => setTimeout(resolve, 16)); // ~60 FPS
    }

    return frameTimes;
  }

  private async performSwipe(
    start: { x: number; y: number },
    direction: string,
    distance: number,
  ) {
    let endX = start.x;
    let endY = start.y;

    switch (direction) {
      case 'up':
        endY -= distance;
        break;
      case 'down':
        endY += distance;
        break;
      case 'left':
        endX -= distance;
        break;
      case 'right':
        endX += distance;
        break;
    }

    await this.driver.performActions([
      {
        type: 'pointer',
        id: 'finger',
        parameters: { pointerType: 'touch' },
        actions: [
          { type: 'pointerMove', duration: 0, x: start.x, y: start.y },
          { type: 'pointerDown', button: 0 },
          { type: 'pointerMove', duration: 300, x: endX, y: endY },
          { type: 'pointerUp', button: 0 },
        ],
      },
    ]);
  }

  private async measureFrameTime(): Promise<number> {
    // Implement platform-specific frame time measurement
    // This is pseudo-code - actual implementation depends on your testing framework
    const frameData = await this.driver.executeScript(
      'mobileGetFrameData'
    );
    return frameData.frameTime;
  }
}
```

---

## Testing with Jest/Vitest

```typescript
import { describe, it, expect } from 'vitest';
import {
  GestureExecutor,
  GestureTimingValidator,
} from '@domains/gesture-testing';

describe('Gesture Performance', () => {
  it('should measure tap timing', async () => {
    const executor = new GestureExecutor(mockDriver, 'ios');
    const validator = new GestureTimingValidator('ios');

    const result = await executor.executeTap('[id=button]');

    expect(result.success).toBe(true);
    expect(validator.isAcceptable(result.metrics)).toBe(true);
    expect(result.metrics.touchDownToResponseMs).toBeLessThan(100);
  });

  it('should detect performance regressions', async () => {
    const executor = new GestureExecutor(mockDriver, 'ios');
    const validator = new GestureTimingValidator('ios');

    const baseline = {
      gestureType: 'tap' as const,
      platform: 'ios' as const,
      touchDownToResponseMs: 80,
      totalDurationMs: 250,
      frameDrops: 0,
      peakLatencyMs: 16.67,
      avgFrameTimeMs: 16.0,
    };

    const result = await executor.executeTap('[id=button]');

    // Regression if 20% slower than baseline
    const isRegression =
      result.metrics.touchDownToResponseMs >
      baseline.touchDownToResponseMs * 1.2;

    expect(isRegression).toBe(false);
  });

  it('should validate cross-platform parity', async () => {
    const iosExecutor = new GestureExecutor(iosDriver, 'ios');
    const androidExecutor = new GestureExecutor(androidDriver, 'android');

    const iosResult = await iosExecutor.executeTap('[id=button]');
    const androidResult = await androidExecutor.executeTap('[id=button]');

    const iosValidator = new GestureTimingValidator('ios');
    const androidValidator = new GestureTimingValidator('android');

    const iosScore = iosValidator.scorePerformance(iosResult.metrics);
    const androidScore = androidValidator.scorePerformance(
      androidResult.metrics
    );

    // Allow 15-point difference
    expect(Math.abs(iosScore - androidScore)).toBeLessThan(15);
  });
});
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Mobile Gesture Performance Tests

on: [push, pull_request]

jobs:
  gesture-tests:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm install

      - name: Run gesture performance tests
        run: npm test -- gesture-testing

      - name: Check for regressions
        run: npm run test:regression -- gesture

      - name: Upload performance metrics
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: gesture-metrics
          path: reports/gesture-metrics.json
```

### Performance Dashboard Metrics

Add to your monitoring dashboard:

```json
{
  "metrics": {
    "gesture_latency_p50": "75ms",
    "gesture_latency_p95": "120ms",
    "frame_drop_rate": "2%",
    "jank_frames_per_second": "0.5",
    "gesture_success_rate": "99.8%",
    "critical_violations": 0
  },
  "thresholds": {
    "latency_alert": "150ms",
    "frame_drop_alert": "5%",
    "regression_threshold": "20%"
  }
}
```

---

## Troubleshooting

### Issue: Tests not finding modules

**Solution:** Use alias imports in vitest.config.ts:
```typescript
resolve: {
  alias: {
    '@domains': path.resolve(__dirname, './src/domains'),
  },
}
```

Then import as:
```typescript
import { GestureExecutor } from '@domains/gesture-testing';
```

### Issue: Frame timing not accurate

**Solution:** Ensure Appium session has performance data enabled:
```javascript
const caps = {
  'appium:enablePerformanceLogging': true,
  'appium:shouldUseMobileViewport': true,
};
```

### Issue: Gesture timing too high

**Common causes:**
- Device/emulator under heavy load
- Background processes running
- Network latency affecting test environment
- Gesture implementation not optimized

**Solution:** Run tests in isolated environment with minimal background load.

---

## Next Steps

1. ✅ Copy files to your project
2. ✅ Implement IDeviceDriver for your test framework
3. ✅ Add tests for your app's critical gestures
4. ✅ Set up CI/CD integration
5. ⏳ Monitor performance metrics continuously
6. ⏳ Integrate with mobile-testing skill coordinator

---

**Questions?** Check GESTURE_TIMING_IMPROVEMENTS.md for detailed documentation.
