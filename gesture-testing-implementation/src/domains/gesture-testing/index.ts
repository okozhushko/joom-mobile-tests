// Timing validation exports
export {
  GestureTimingValidator,
  DEFAULT_THRESHOLDS,
  calculateFrameDrops,
  calculateAverageFrameTime,
  buildMetrics,
} from './gesture-timing-validator.js';

export type {
  GestureType,
  Platform,
  GestureTimingMetrics,
  TimingThresholds,
  GestureTimingViolation,
} from './gesture-timing-validator.js';

// Gesture execution exports
export {
  GestureExecutor,
  GestureSequenceExecutor,
} from './gesture-executor.js';

export type {
  GestureExecutionResult,
  IDeviceDriver,
  GestureCoordinates,
  TapGestureOptions,
  SwipeGestureOptions,
  PinchGestureOptions,
  LongPressGestureOptions,
  RotateGestureOptions,
} from './gesture-executor.js';

// Device profile exports
export {
  COMMON_DEVICE_PROFILES,
  detectDeviceType,
  isVirtualized,
  getDeviceTier,
  compareDeviceProfiles,
  getDeviceDescription,
} from './device-profile.js';

export type {
  DeviceType,
  DeviceOS,
  DeviceTier,
  DeviceProfile,
  DeviceTimingBaseline,
} from './device-profile.js';

// Platform divergence detection exports
export {
  PlatformDivergenceDetector,
  formatDivergence,
  calculateMedianDivergence,
  DEFAULT_DIVERGENCE_THRESHOLDS,
} from './platform-divergence-detector.js';

export type {
  DivergenceMetrics,
  DivergenceReport,
  DivergenceThresholds,
} from './platform-divergence-detector.js';

// Statistical analysis exports
export {
  StatisticalAnalyzer,
  formatStatisticalSummary,
  mean,
  median,
  standardDeviation,
  DEFAULT_OUTLIER_CONFIG,
} from './statistical-analyzer.js';

export type {
  StatisticalSummary,
  OutlierDetectionConfig,
} from './statistical-analyzer.js';

// Metrics aggregation exports
export {
  MetricsAggregator,
} from './metrics-aggregator.js';

export type {
  DeviceMetrics,
  AggregatedMetrics,
  AggregationReport,
} from './metrics-aggregator.js';
