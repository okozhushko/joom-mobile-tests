/**
 * Statistical Analyzer for Gesture Metrics
 *
 * Performs statistical analysis on gesture timing data:
 * - Percentiles (p50, p95, p99)
 * - Outlier detection (IQR method)
 * - Variance and standard deviation
 * - Distribution analysis
 *
 * @module gesture-testing/statistical-analyzer
 */

export interface StatisticalSummary {
  count: number;
  min: number;
  max: number;
  mean: number;
  median: number;
  stdDev: number;
  variance: number;
  p25: number; // 25th percentile (Q1)
  p50: number; // 50th percentile (median)
  p75: number; // 75th percentile (Q3)
  p95: number; // 95th percentile
  p99: number; // 99th percentile
  iqr: number; // Interquartile range (Q3 - Q1)
  outlierCount: number;
  outliersLow: number[];
  outliersHigh: number[];
}

export interface OutlierDetectionConfig {
  method: 'iqr' | 'zscore' | 'modified-zscore';
  iqrMultiplier?: number; // Default: 1.5 for mild, 3.0 for extreme
  zscoreThreshold?: number; // Default: 3.0
}

export const DEFAULT_OUTLIER_CONFIG: OutlierDetectionConfig = {
  method: 'iqr',
  iqrMultiplier: 1.5, // Mild outliers
};

/**
 * Statistical analyzer for gesture timing metrics.
 */
export class StatisticalAnalyzer {
  private outlierConfig: OutlierDetectionConfig;

  constructor(config: Partial<OutlierDetectionConfig> = {}) {
    this.outlierConfig = {
      ...DEFAULT_OUTLIER_CONFIG,
      ...config,
    };
  }

  /**
   * Calculate comprehensive statistical summary of data.
   */
  analyze(values: number[]): StatisticalSummary {
    if (values.length === 0) {
      throw new Error('Cannot analyze empty array');
    }

    const sorted = [...values].sort((a, b) => a - b);
    const count = values.length;

    // Basic statistics
    const min = sorted[0];
    const max = sorted[count - 1];
    const mean = values.reduce((a, b) => a + b, 0) / count;

    // Percentiles
    const p25 = this.percentile(sorted, 0.25);
    const p50 = this.percentile(sorted, 0.5);
    const p75 = this.percentile(sorted, 0.75);
    const p95 = this.percentile(sorted, 0.95);
    const p99 = this.percentile(sorted, 0.99);

    // Variance and standard deviation
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / count;
    const stdDev = Math.sqrt(variance);

    // IQR
    const iqr = p75 - p25;

    // Outlier detection
    const { outliersLow, outliersHigh } = this.detectOutliers(
      values,
      p25,
      p75,
      iqr,
    );

    return {
      count,
      min,
      max,
      mean,
      median: p50,
      stdDev,
      variance,
      p25,
      p50,
      p75,
      p95,
      p99,
      iqr,
      outlierCount: outliersLow.length + outliersHigh.length,
      outliersLow: outliersLow.sort((a, b) => a - b),
      outliersHigh: outliersHigh.sort((a, b) => a - b),
    };
  }

  /**
   * Calculate percentile value.
   */
  private percentile(sorted: number[], p: number): number {
    const index = p * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;

    if (lower === upper) {
      return sorted[lower];
    }

    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  /**
   * Detect outliers using IQR method.
   */
  private detectOutliers(
    values: number[],
    q1: number,
    q3: number,
    iqr: number,
  ): { outliersLow: number[]; outliersHigh: number[] } {
    const multiplier = this.outlierConfig.iqrMultiplier || 1.5;
    const lowerBound = q1 - multiplier * iqr;
    const upperBound = q3 + multiplier * iqr;

    const outliersLow = values.filter(v => v < lowerBound);
    const outliersHigh = values.filter(v => v > upperBound);

    return { outliersLow, outliersHigh };
  }

  /**
   * Detect outliers using Z-score method.
   */
  detectOutliersZscore(values: number[]): number[] {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length,
    );

    const threshold = this.outlierConfig.zscoreThreshold || 3.0;

    return values.filter(v => Math.abs((v - mean) / stdDev) > threshold);
  }

  /**
   * Calculate coefficient of variation (CV = stdDev / mean).
   * Useful for comparing variability across different scales.
   */
  coefficientOfVariation(values: number[]): number {
    if (values.length === 0) {
      return 0;
    }
    const summary = this.analyze(values);
    if (summary.mean === 0) {
      return 0;
    }
    return (summary.stdDev / summary.mean) * 100; // Return as percentage
  }

  /**
   * Remove outliers and return cleaned data.
   */
  removeOutliers(values: number[]): {
    cleaned: number[];
    removed: number[];
    count: number;
  } {
    const summary = this.analyze(values);
    const removed = [...summary.outliersLow, ...summary.outliersHigh];
    const cleaned = values.filter(v => !removed.includes(v));

    return {
      cleaned,
      removed,
      count: removed.length,
    };
  }

  /**
   * Compare two datasets and determine if they're statistically different.
   */
  compareDatasets(
    data1: number[],
    data2: number[],
  ): {
    significantlyDifferent: boolean;
    meanDifference: number;
    percentDifference: number;
    overlapPercentage: number;
  } {
    const summary1 = this.analyze(data1);
    const summary2 = this.analyze(data2);

    const meanDifference = summary2.mean - summary1.mean;
    const percentDifference = (meanDifference / summary1.mean) * 100;

    // Simple test: if ranges don't overlap significantly, they're different
    const minOverlapStart = Math.max(summary1.min, summary2.min);
    const maxOverlapEnd = Math.min(summary1.max, summary2.max);
    const overlapSize = Math.max(0, maxOverlapEnd - minOverlapStart);
    const totalRange = Math.max(summary1.max, summary2.max) -
                       Math.min(summary1.min, summary2.min);
    const overlapPercentage = totalRange > 0 ? (overlapSize / totalRange) * 100 : 0;

    // Significant if means differ by >20% OR <30% overlap
    const significantlyDifferent =
      Math.abs(percentDifference) > 20 || overlapPercentage < 30;

    return {
      significantlyDifferent,
      meanDifference,
      percentDifference,
      overlapPercentage,
    };
  }

  /**
   * Identify the distribution type (normal, skewed, etc).
   */
  analyzeDistribution(values: number[]): {
    type: 'normal' | 'skewed-left' | 'skewed-right' | 'bimodal' | 'unknown';
    skewness: number;
    kurtosis: number;
  } {
    const summary = this.analyze(values);

    // Skewness: measure of asymmetry
    // Positive = right skew, Negative = left skew
    const meanDevs = values.map(v => Math.pow(v - summary.mean, 3));
    const skewness =
      (meanDevs.reduce((a, b) => a + b, 0) / values.length) /
      Math.pow(summary.stdDev, 3);

    // Kurtosis: measure of tailedness
    const kurtMeanDevs = values.map(v => Math.pow(v - summary.mean, 4));
    const kurtosis =
      (kurtMeanDevs.reduce((a, b) => a + b, 0) / values.length) /
      Math.pow(summary.stdDev, 4) - 3;

    // Determine distribution type
    let type: 'normal' | 'skewed-left' | 'skewed-right' | 'bimodal' | 'unknown' = 'normal';

    if (Math.abs(skewness) > 1) {
      type = skewness > 0 ? 'skewed-right' : 'skewed-left';
    } else if (kurtosis > 1) {
      type = 'bimodal'; // High kurtosis suggests peaks
    }

    return { type, skewness, kurtosis };
  }

  /**
   * Calculate confidence interval for mean.
   */
  confidenceInterval(
    values: number[],
    confidenceLevel: number = 0.95,
  ): { lower: number; upper: number; marginOfError: number } {
    const summary = this.analyze(values);

    // Using t-distribution (simplified for large n)
    // For n > 30, can use z-score approximation
    const zScore = confidenceLevel === 0.95 ? 1.96 :
                   confidenceLevel === 0.99 ? 2.576 : 1.645;

    const marginOfError =
      (zScore * summary.stdDev) / Math.sqrt(summary.count);

    return {
      lower: summary.mean - marginOfError,
      upper: summary.mean + marginOfError,
      marginOfError,
    };
  }

  /**
   * Create histogram buckets for data distribution visualization.
   */
  histogram(
    values: number[],
    bucketCount: number = 10,
  ): {
    buckets: Array<{ min: number; max: number; count: number; percentage: number }>;
    outliers: { low: number; high: number };
  } {
    const summary = this.analyze(values);
    const range = summary.max - summary.min;
    const bucketSize = range / bucketCount;

    const buckets = Array.from({ length: bucketCount }, (_, i) => {
      const min = summary.min + i * bucketSize;
      const max = min + bucketSize;
      const count = values.filter(v => v >= min && v < max).length;

      return {
        min,
        max,
        count,
        percentage: (count / values.length) * 100,
      };
    });

    return {
      buckets,
      outliers: {
        low: summary.outliersLow.length,
        high: summary.outliersHigh.length,
      },
    };
  }
}

/**
 * Format statistical summary for display.
 */
export function formatStatisticalSummary(summary: StatisticalSummary): string {
  return `
Statistical Summary:
├─ Count: ${summary.count}
├─ Range: ${summary.min.toFixed(2)} - ${summary.max.toFixed(2)} (${(summary.max - summary.min).toFixed(2)})
├─ Mean: ${summary.mean.toFixed(2)}ms
├─ Median (p50): ${summary.median.toFixed(2)}ms
├─ Std Dev: ${summary.stdDev.toFixed(2)}ms
├─ Variance: ${summary.variance.toFixed(2)}
├─ P25: ${summary.p25.toFixed(2)}ms
├─ P75: ${summary.p75.toFixed(2)}ms
├─ P95: ${summary.p95.toFixed(2)}ms
├─ P99: ${summary.p99.toFixed(2)}ms
├─ IQR: ${summary.iqr.toFixed(2)}ms
└─ Outliers: ${summary.outlierCount} (Low: ${summary.outliersLow.length}, High: ${summary.outliersHigh.length})
  `.trim();
}

/**
 * Quick helper: calculate mean of values.
 */
export function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Quick helper: calculate median of values.
 */
export function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Quick helper: calculate standard deviation.
 */
export function standardDeviation(values: number[]): number {
  const m = mean(values);
  const variance =
    values.reduce((sum, v) => sum + Math.pow(v - m, 2), 0) / values.length;
  return Math.sqrt(variance);
}
