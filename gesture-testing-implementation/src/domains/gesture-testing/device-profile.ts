/**
 * Device Profile Management for Divergence Detection
 *
 * Profiles capture device characteristics to identify emulator vs real device
 * and track divergence patterns.
 *
 * @module gesture-testing/device-profile
 */

export type DeviceType = 'real-device' | 'emulator' | 'simulator' | 'unknown';
export type DeviceOS = 'ios' | 'android';
export type DeviceTier = 'tier-1' | 'tier-2' | 'tier-3';

export interface DeviceProfile {
  id: string; // Unique device identifier
  name: string; // Device name (e.g., "iPhone 15 Pro", "Pixel 8")
  type: DeviceType;
  os: DeviceOS;
  osVersion: string; // e.g., "17.0", "14.0"
  tier: DeviceTier; // Tier 1: 60% users, Tier 2: 30%, Tier 3: 10%
  cpuModel?: string; // e.g., "A17 Pro", "Snapdragon 8 Gen 3"
  ramMB?: number;
  screenDPI?: number;
  hasGPUAcceleration?: boolean;
  isVirtualized?: boolean; // true for emulator/simulator
}

export interface DeviceTimingBaseline {
  deviceId: string;
  gestureType: string;
  medianLatencyMs: number; // Median touch-to-response
  p95LatencyMs: number; // 95th percentile
  p99LatencyMs: number; // 99th percentile
  avgFrameDrops: number;
  sampleSize: number;
  lastMeasuredAt: number; // timestamp
}

/**
 * Common device profiles for reference
 */
export const COMMON_DEVICE_PROFILES: Record<string, DeviceProfile> = {
  // iOS Real Devices (Tier 1)
  'iphone-15-pro': {
    id: 'iphone-15-pro',
    name: 'iPhone 15 Pro',
    type: 'real-device',
    os: 'ios',
    osVersion: '17.0+',
    tier: 'tier-1',
    cpuModel: 'A17 Pro',
    ramMB: 8192,
    screenDPI: 460,
    hasGPUAcceleration: true,
    isVirtualized: false,
  },

  'iphone-15': {
    id: 'iphone-15',
    name: 'iPhone 15',
    type: 'real-device',
    os: 'ios',
    osVersion: '17.0+',
    tier: 'tier-1',
    cpuModel: 'A16 Bionic',
    ramMB: 6144,
    screenDPI: 460,
    hasGPUAcceleration: true,
    isVirtualized: false,
  },

  'iphone-14': {
    id: 'iphone-14',
    name: 'iPhone 14',
    type: 'real-device',
    os: 'ios',
    osVersion: '16.0+',
    tier: 'tier-2',
    cpuModel: 'A15 Bionic',
    ramMB: 6144,
    screenDPI: 460,
    hasGPUAcceleration: true,
    isVirtualized: false,
  },

  'iphone-13': {
    id: 'iphone-13',
    name: 'iPhone 13',
    type: 'real-device',
    os: 'ios',
    osVersion: '15.0+',
    tier: 'tier-2',
    cpuModel: 'A15 Bionic',
    ramMB: 4096,
    screenDPI: 460,
    hasGPUAcceleration: true,
    isVirtualized: false,
  },

  'iphone-12': {
    id: 'iphone-12',
    name: 'iPhone 12',
    type: 'real-device',
    os: 'ios',
    osVersion: '14.0+',
    tier: 'tier-3',
    cpuModel: 'A14 Bionic',
    ramMB: 4096,
    screenDPI: 460,
    hasGPUAcceleration: true,
    isVirtualized: false,
  },

  // Android Real Devices (Tier 1)
  'galaxy-s24': {
    id: 'galaxy-s24',
    name: 'Samsung Galaxy S24',
    type: 'real-device',
    os: 'android',
    osVersion: '14.0+',
    tier: 'tier-1',
    cpuModel: 'Snapdragon 8 Gen 3',
    ramMB: 12288,
    screenDPI: 416,
    hasGPUAcceleration: true,
    isVirtualized: false,
  },

  'pixel-8': {
    id: 'pixel-8',
    name: 'Google Pixel 8',
    type: 'real-device',
    os: 'android',
    osVersion: '14.0+',
    tier: 'tier-1',
    cpuModel: 'Google Tensor G3',
    ramMB: 8192,
    screenDPI: 428,
    hasGPUAcceleration: true,
    isVirtualized: false,
  },

  'galaxy-s23': {
    id: 'galaxy-s23',
    name: 'Samsung Galaxy S23',
    type: 'real-device',
    os: 'android',
    osVersion: '13.0+',
    tier: 'tier-2',
    cpuModel: 'Snapdragon 8 Gen 2',
    ramMB: 8192,
    screenDPI: 416,
    hasGPUAcceleration: true,
    isVirtualized: false,
  },

  'pixel-7': {
    id: 'pixel-7',
    name: 'Google Pixel 7',
    type: 'real-device',
    os: 'android',
    osVersion: '12.0+',
    tier: 'tier-2',
    cpuModel: 'Google Tensor G2',
    ramMB: 8192,
    screenDPI: 411,
    hasGPUAcceleration: true,
    isVirtualized: false,
  },

  // iOS Simulator
  'ios-simulator-iphone15': {
    id: 'ios-simulator-iphone15',
    name: 'iOS Simulator (iPhone 15)',
    type: 'simulator',
    os: 'ios',
    osVersion: '17.0+',
    tier: 'tier-1',
    cpuModel: 'Varies with host',
    ramMB: 4096,
    screenDPI: 460,
    hasGPUAcceleration: true,
    isVirtualized: true,
  },

  'ios-simulator-iphone14': {
    id: 'ios-simulator-iphone14',
    name: 'iOS Simulator (iPhone 14)',
    type: 'simulator',
    os: 'ios',
    osVersion: '16.0+',
    tier: 'tier-2',
    cpuModel: 'Varies with host',
    ramMB: 4096,
    screenDPI: 460,
    hasGPUAcceleration: true,
    isVirtualized: true,
  },

  // Android Emulator
  'android-emulator-pixel8': {
    id: 'android-emulator-pixel8',
    name: 'Android Emulator (Pixel 8)',
    type: 'emulator',
    os: 'android',
    osVersion: '14.0+',
    tier: 'tier-1',
    cpuModel: 'Varies with host',
    ramMB: 4096,
    screenDPI: 428,
    hasGPUAcceleration: false,
    isVirtualized: true,
  },

  'android-emulator-pixel7': {
    id: 'android-emulator-pixel7',
    name: 'Android Emulator (Pixel 7)',
    type: 'emulator',
    os: 'android',
    osVersion: '12.0+',
    tier: 'tier-2',
    cpuModel: 'Varies with host',
    ramMB: 2048,
    screenDPI: 411,
    hasGPUAcceleration: false,
    isVirtualized: true,
  },
};

/**
 * Detect device type from characteristics.
 * Uses heuristics to identify real vs virtual devices.
 */
export function detectDeviceType(profile: Partial<DeviceProfile>): DeviceType {
  if (profile.isVirtualized === true) {
    return profile.os === 'ios' ? 'simulator' : 'emulator';
  }

  if (profile.isVirtualized === false) {
    return 'real-device';
  }

  // Heuristic: emulators typically have lower RAM and no GPU
  if (profile.ramMB && profile.ramMB < 3000 && !profile.hasGPUAcceleration) {
    return profile.os === 'ios' ? 'simulator' : 'emulator';
  }

  return 'unknown';
}

/**
 * Check if device is virtualized (emulator/simulator).
 */
export function isVirtualized(deviceType: DeviceType): boolean {
  return deviceType === 'emulator' || deviceType === 'simulator';
}

/**
 * Get device tier from profile name or tier field.
 */
export function getDeviceTier(profile: Partial<DeviceProfile>): DeviceTier {
  if (profile.tier) {
    return profile.tier;
  }

  // Heuristic based on device characteristics
  if (profile.ramMB && profile.ramMB >= 8000 && profile.type === 'real-device') {
    return 'tier-1';
  }

  if (profile.ramMB && profile.ramMB >= 4000) {
    return 'tier-2';
  }

  return 'tier-3';
}

/**
 * Compare two device profiles and identify differences.
 */
export function compareDeviceProfiles(
  device1: DeviceProfile,
  device2: DeviceProfile,
): {
  differences: string[];
  similarity: number; // 0-100
} {
  const differences: string[] = [];
  let matchScore = 0;

  if (device1.os === device2.os) matchScore += 20;
  else differences.push(`OS: ${device1.os} vs ${device2.os}`);

  if (device1.osVersion === device2.osVersion) matchScore += 15;
  else differences.push(`OS Version: ${device1.osVersion} vs ${device2.osVersion}`);

  if (device1.tier === device2.tier) matchScore += 20;
  else differences.push(`Tier: ${device1.tier} vs ${device2.tier}`);

  if (device1.type === device2.type) matchScore += 20;
  else differences.push(`Type: ${device1.type} vs ${device2.type}`);

  if (device1.cpuModel === device2.cpuModel) matchScore += 15;
  else if (device1.cpuModel && device2.cpuModel) {
    differences.push(`CPU: ${device1.cpuModel} vs ${device2.cpuModel}`);
  }

  if (device1.hasGPUAcceleration === device2.hasGPUAcceleration) matchScore += 10;
  else differences.push(`GPU: ${device1.hasGPUAcceleration ? 'Yes' : 'No'} vs ${device2.hasGPUAcceleration ? 'Yes' : 'No'}`);

  return {
    differences,
    similarity: matchScore,
  };
}

/**
 * Get device description for logging/reporting.
 */
export function getDeviceDescription(profile: DeviceProfile): string {
  const type = isVirtualized(profile.type) ? '(Virtual)' : '(Real)';
  return `${profile.name} ${profile.os} ${profile.osVersion} ${type} - ${profile.tier}`;
}
