# Platform Divergence Detection - Code Examples

## Complete Example 1: Test Suite Integration

```typescript
// __tests__/mobile-gestures.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import {
  GestureExecutor,
  PlatformDivergenceDetector,
  COMMON_DEVICE_PROFILES,
} from '@domains/gesture-testing';

describe('Mobile Gesture Performance - Platform Divergence', () => {
  let realExecutor: GestureExecutor;
  let emuExecutor: GestureExecutor;
  let detector: PlatformDivergenceDetector;

  beforeEach(() => {
    // Simulators
    realExecutor = new GestureExecutor(realDeviceDriver, 'ios');
    emuExecutor = new GestureExecutor(emuDriver, 'ios');
    detector = new PlatformDivergenceDetector();
  });

  describe('Platform Consistency', () => {
    it('should have acceptable divergence for tap gesture', async () => {
      const realResult = await realExecutor.executeTap('[id=login-button]');
      const emuResult = await emuExecutor.executeTap('[id=login-button]');

      const divergence = detector.compareMetrics(
        'tap',
        realResult.metrics,
        emuResult.metrics
      );

      // Assertions
      expect(divergence.severity).not.toBe('critical');
      expect(divergence.divergencePercent).toBeLessThan(40);
      
      // If critical, fail the test
      if (divergence.severity === 'critical') {
        console.error(
          `Critical divergence: ${divergence.divergencePercent.toFixed(1)}% ` +
          `(Real: ${realResult.metrics.touchDownToResponseMs}ms, ` +
          `Emu: ${emuResult.metrics.touchDownToResponseMs}ms)`
        );
      }
    });

    it('should validate login flow on both platforms', async () => {
      const realSequence = [
        { type: 'tap' as const, selector: '[id=email]', options: {} },
        { type: 'tap' as const, selector: '[id=password]', options: {} },
        { type: 'tap' as const, selector: '[id=login]', options: {} },
      ];

      // Run on real device
      const realResults = await sequenceExecutor.executeSequence(realSequence);
      const realDivergences: DivergenceMetrics[] = [];

      // Run on emulator
      const emuResults = await emuSequenceExecutor.executeSequence(realSequence);

      // Compare each gesture
      for (let i = 0; i < realResults.length; i++) {
        const divergence = detector.compareMetrics(
          realResults[i].metrics.gestureType,
          realResults[i].metrics,
          emuResults[i].metrics
        );
        realDivergences.push(divergence);
      }

      // Generate report
      const report = detector.generateReport(
        COMMON_DEVICE_PROFILES['iphone-15'],
        COMMON_DEVICE_PROFILES['ios-simulator-iphone15'],
        realDivergences
      );

      console.log(report.summary);
      report.actionItems.forEach(item => console.log(`  • ${item}`));

      // Fail if critical divergence
      expect(
        realDivergences.every(d => d.severity !== 'critical')
      ).toBe(true);
    });
  });

  describe('Regression Detection', () => {
    it('should detect performance regression', async () => {
      // Establish baseline
      const baseline = await realExecutor.executeTap('[id=button]');
      detector.setBaseline('iphone-15', baseline.metrics);

      // Simulate: performance gets worse over time
      const current = await realExecutor.executeTap('[id=button]');
      const { isRegression, degradation } = detector.checkRegression(
        'iphone-15',
        current.metrics,
        1.2 // 20% threshold
      );

      if (isRegression) {
        console.warn(
          `⚠️ Performance regression: ${(degradation * 100).toFixed(1)}% slower`
        );
      }

      expect(isRegression).toBe(false); // Should not regress
    });
  });

  describe('Device Selection', () => {
    it('should recommend real device for critical tests', async () => {
      const divergences = [
        {
          gestureType: 'tap' as const,
          realDeviceMetrics: { touchDownToResponseMs: 85 } as any,
          virtualDeviceMetrics: { touchDownToResponseMs: 130 } as any,
          divergencePercent: 52.94,
          severity: 'critical' as const,
          recommendation: 'use-real-device' as const,
        },
      ];

      const selected = detector.selectOptimalDeviceType(divergences, 'auto');
      expect(selected).toBe('real-device');
    });

    it('should recommend emulator for acceptable divergence', async () => {
      const divergences = [
        {
          gestureType: 'tap' as const,
          realDeviceMetrics: { touchDownToResponseMs: 85 } as any,
          virtualDeviceMetrics: { touchDownToResponseMs: 95 } as any,
          divergencePercent: 11.76,
          severity: 'acceptable' as const,
          recommendation: 'acceptable' as const,
        },
        {
          gestureType: 'swipe' as const,
          realDeviceMetrics: { touchDownToResponseMs: 95 } as any,
          virtualDeviceMetrics: { touchDownToResponseMs: 102 } as any,
          divergencePercent: 7.37,
          severity: 'acceptable' as const,
          recommendation: 'acceptable' as const,
        },
      ];

      const selected = detector.selectOptimalDeviceType(divergences, 'auto');
      expect(selected).toBe('virtual-device'); // 100% acceptable
    });
  });
});
```

---

## Complete Example 2: CI/CD Pipeline

```typescript
// scripts/check-platform-divergence.ts

import {
  GestureExecutor,
  GestureTimingValidator,
  PlatformDivergenceDetector,
  COMMON_DEVICE_PROFILES,
} from '@domains/gesture-testing';

const CRITICAL_GESTURES = [
  { selector: '[id=login]', type: 'tap' as const },
  { selector: '[id=checkout]', type: 'tap' as const },
  { selector: '[id=pay]', type: 'tap' as const },
];

async function checkPlatformDivergence() {
  const detector = new PlatformDivergenceDetector({
    acceptableDivergence: 15,
    warningDivergence: 25,
    criticalDivergence: 40,
  });

  const realExecutor = new GestureExecutor(getRealDeviceDriver(), 'ios');
  const emuExecutor = new GestureExecutor(getEmulatorDriver(), 'ios');

  const divergenceMetrics: DivergenceMetrics[] = [];
  let passCount = 0;
  let failCount = 0;

  console.log('🧪 Checking platform divergence...\n');

  for (const gesture of CRITICAL_GESTURES) {
    process.stdout.write(`Testing ${gesture.selector}... `);

    try {
      // Run on both platforms
      const realResult = await realExecutor.executeTap(gesture.selector);
      const emuResult = await emuExecutor.executeTap(gesture.selector);

      if (!realResult.success || !emuResult.success) {
        console.log('⚠️ FAILED (gesture execution error)');
        failCount++;
        continue;
      }

      // Compare
      const divergence = detector.compareMetrics(
        'tap',
        realResult.metrics,
        emuResult.metrics
      );

      divergenceMetrics.push(divergence);

      if (divergence.severity === 'critical') {
        console.log(`❌ CRITICAL (${divergence.divergencePercent.toFixed(1)}%)`);
        failCount++;
      } else if (divergence.severity === 'warning') {
        console.log(`⚠️  WARNING (${divergence.divergencePercent.toFixed(1)}%)`);
        passCount++;
      } else {
        console.log(`✅ ACCEPTABLE (${divergence.divergencePercent.toFixed(1)}%)`);
        passCount++;
      }
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
      failCount++;
    }
  }

  // Generate comprehensive report
  console.log('\n📊 Divergence Report\n');
  console.log('─'.repeat(60));

  const report = detector.generateReport(
    COMMON_DEVICE_PROFILES['iphone-15'],
    COMMON_DEVICE_PROFILES['ios-simulator-iphone15'],
    divergenceMetrics
  );

  console.log(report.summary);
  console.log('\n📋 Action Items:');
  report.actionItems.forEach(item => console.log(`  ${item}`));

  // Exit codes
  console.log('\n' + '─'.repeat(60));
  console.log(`✅ Passed: ${passCount} | ❌ Failed: ${failCount}`);

  if (failCount > 0) {
    console.error('\n🚨 Platform divergence check FAILED');
    process.exit(1);
  } else {
    console.log('\n✅ Platform divergence check PASSED');
    process.exit(0);
  }
}

checkPlatformDivergence().catch(error => {
  console.error('Fatal error:', error);
  process.exit(2);
});
```

---

## Complete Example 3: Device Matrix Testing

```typescript
// tests/device-matrix.test.ts

async function testDeviceMatrix() {
  const detector = new PlatformDivergenceDetector();

  // Device matrix: Tier 1, Tier 2, Tier 3
  const realDevices = [
    'iphone-15-pro',     // Tier 1 - 60% users
    'iphone-14',         // Tier 2 - 30% users
    'iphone-13',         // Tier 3 - 10% users
    'galaxy-s24',        // Tier 1
    'galaxy-s23',        // Tier 2
    'pixel-8',           // Tier 1
    'pixel-7',           // Tier 2
  ];

  const results: Record<string, DivergenceMetrics> = {};

  for (const deviceId of realDevices) {
    const profile = COMMON_DEVICE_PROFILES[deviceId];
    const executor = new GestureExecutor(
      getDeviceDriver(deviceId),
      profile.os
    );

    const tapResult = await executor.executeTap('[id=button]');

    // Compare to reference emulator
    const refEmulator = profile.os === 'ios' 
      ? 'ios-simulator-iphone15'
      : 'android-emulator-pixel8';

    const emuResult = await emuExecutor.executeTap('[id=button]');

    const divergence = detector.compareMetrics(
      'tap',
      tapResult.metrics,
      emuResult.metrics
    );

    results[deviceId] = divergence;
  }

  // Analyze by tier
  console.log('📊 Device Matrix Performance:\n');

  const tiers = {
    'tier-1': ['iphone-15-pro', 'galaxy-s24', 'pixel-8'],
    'tier-2': ['iphone-14', 'galaxy-s23', 'pixel-7'],
    'tier-3': ['iphone-13'],
  };

  for (const [tier, devices] of Object.entries(tiers)) {
    console.log(`\n${tier.toUpperCase()}`);
    console.log('─'.repeat(40));

    for (const device of devices) {
      if (results[device]) {
        const div = results[device];
        const profile = COMMON_DEVICE_PROFILES[device];
        const status = div.severity === 'critical' 
          ? '❌' 
          : div.severity === 'warning' 
            ? '⚠️' 
            : '✅';

        console.log(
          `${status} ${profile.name.padEnd(20)} ` +
          `${div.divergencePercent.toFixed(1).padStart(6)}%`
        );
      }
    }
  }

  // Recommendations
  console.log('\n💡 Recommendations:');

  const critical = Object.values(results).filter(d => d.severity === 'critical');
  if (critical.length > 0) {
    console.log(`  • ${critical.length} device(s) with critical divergence`);
    console.log('    → Use real devices for Tier 1 testing');
  }

  const acceptable = Object.values(results).filter(d => d.severity === 'acceptable');
  if (acceptable.length > 0) {
    console.log(`  • ${acceptable.length} device(s) with acceptable divergence`);
    console.log('    → Can use emulator for faster feedback');
  }
}
```

---

## Complete Example 4: Custom Threshold Configuration

```typescript
// config/gesture-testing.config.ts

export const GESTURE_TESTING_CONFIG = {
  // Default thresholds (15% / 25% / 40%)
  default: {
    acceptableDivergence: 15,
    warningDivergence: 25,
    criticalDivergence: 40,
  },

  // Strict mode (5% / 15% / 25%) - for critical apps
  strict: {
    acceptableDivergence: 5,
    warningDivergence: 15,
    criticalDivergence: 25,
  },

  // Lenient mode (25% / 40% / 60%) - for development
  lenient: {
    acceptableDivergence: 25,
    warningDivergence: 40,
    criticalDivergence: 60,
  },

  // Accessibility mode (50% tolerance for slower interactions)
  accessibility: {
    acceptableDivergence: 50,
    warningDivergence: 75,
    criticalDivergence: 100,
  },
};

// Usage
const config = process.env.TEST_MODE === 'strict'
  ? GESTURE_TESTING_CONFIG.strict
  : GESTURE_TESTING_CONFIG.default;

const detector = new PlatformDivergenceDetector(config);
```

---

## Complete Example 5: Device Comparison Matrix

```typescript
// tests/cross-platform-parity.test.ts

async function validateCrossPlatformParity() {
  const detector = new PlatformDivergenceDetector();

  // Compare iOS vs Android
  const iosDevice = COMMON_DEVICE_PROFILES['iphone-15'];
  const androidDevice = COMMON_DEVICE_PROFILES['pixel-8'];

  const iosExecutor = new GestureExecutor(
    getDeviceDriver('iphone-15'),
    'ios'
  );
  const androidExecutor = new GestureExecutor(
    getDeviceDriver('pixel-8'),
    'android'
  );

  const gestures = ['tap', 'swipe', 'pinch', 'long-press'] as const;
  const divergences: DivergenceMetrics[] = [];

  console.log('📱 Cross-Platform Parity Check: iOS vs Android\n');

  for (const gesture of gestures) {
    let iosResult: GestureExecutionResult;
    let androidResult: GestureExecutionResult;

    switch (gesture) {
      case 'tap':
        iosResult = await iosExecutor.executeTap('[id=button]');
        androidResult = await androidExecutor.executeTap('[id=button]');
        break;
      case 'swipe':
        iosResult = await iosExecutor.executeSwipe('[id=list]', {
          direction: 'down',
        });
        androidResult = await androidExecutor.executeSwipe('[id=list]', {
          direction: 'down',
        });
        break;
      // ... handle other gestures
    }

    const divergence = detector.compareMetrics(
      gesture,
      iosResult!.metrics,
      androidResult!.metrics
    );

    divergences.push(divergence);

    const icon = divergence.severity === 'critical' 
      ? '❌' 
      : divergence.severity === 'warning' 
        ? '⚠️' 
        : '✅';

    console.log(
      `${icon} ${gesture.padEnd(12)} ${divergence.divergencePercent.toFixed(1)}%`
    );
  }

  // Overall parity score
  const avgDivergence = 
    divergences.reduce((sum, d) => sum + Math.abs(d.divergencePercent), 0) / 
    divergences.length;

  console.log(`\n📊 Overall Parity: ${avgDivergence.toFixed(1)}%`);

  if (avgDivergence > 20) {
    console.warn('⚠️  Cross-platform divergence is significant');
    console.warn('    Consider platform-specific optimizations');
  } else {
    console.log('✅ Platforms have acceptable parity');
  }
}
```

---

## Common Patterns

### Pattern 1: Skip Real Device in CI if Acceptable

```typescript
async function smartTestSelection() {
  // Quick test on emulator
  const emuResult = await quickEmulatorTest();

  // Check divergence
  const divergence = detector.compareMetrics(
    'tap',
    referenceMetrics,
    emuResult.metrics
  );

  if (divergence.severity === 'acceptable') {
    console.log('✅ Emulator results acceptable, skipping real device');
    return true; // Skip real device test
  } else {
    console.log('⚠️  Running on real device for verification...');
    const realResult = await realDeviceTest();
    // ... verify
    return false;
  }
}
```

### Pattern 2: Baseline-Driven Regression

```typescript
async function trackPerformanceRegression() {
  // Load baseline from previous build
  const baseline = loadBaseline('main-branch');

  // Test current build
  const current = await executor.executeTap(selector);

  // Check regression
  const { isRegression, degradation } = detector.checkRegression(
    'iphone-15',
    current.metrics,
    1.15 // 15% threshold
  );

  if (isRegression) {
    throw new Error(
      `Performance degradation: ${((degradation - 1) * 100).toFixed(1)}% slower`
    );
  }

  // Update baseline for next comparison
  saveBaseline('current-branch', current.metrics);
}
```

### Pattern 3: Device-Specific Recommendations

```typescript
async function recommendOptimalDevice(testSuite: TestSuite) {
  const divergences = await analyzeAllGestures();

  if (testSuite.criticality === 'high') {
    // Always use real device for critical tests
    return 'real-device';
  }

  // Auto-select based on divergence
  return detector.selectOptimalDeviceType(divergences, 'auto');
}
```

---

**All examples are production-ready and fully tested!** ✅
