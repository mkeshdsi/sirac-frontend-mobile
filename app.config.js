// Ensure Expo CLI reads this config and sets web.output to 'single'
module.exports = {
  name: 'SIRAC',
  slug: 'sirac',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'sirac',
  userInterfaceStyle: 'light',
  platforms: ['android', 'ios'],
  updates: {
    fallbackToCacheTimeout: 0,
    url: 'https://u.expo.dev/1d5f13c3-18c6-418b-ad75-9a41e922dc29'
  },
  runtimeVersion: {
    policy: 'appVersion'
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.eleuterio.sirac',
    infoPlist: {
      NSLocationWhenInUseUsageDescription: 'This app needs access to location when open to show your position on the map.',
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: true,
      },
    },
    icon: './logo_png.png',
  },
  android: {
    package: 'com.eleuterio.sirac',
    permissions: [
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
    ],
    icon: './logo_png.png',
  },
  web: {
    output: 'single',
  },
  plugins: [
    [
      'expo-build-properties',
      {
        android: {
          usesCleartextTraffic: true,
        },
      },
    ],
  ],
  extra: {
    eas: {
      projectId: '1d5f13c3-18c6-418b-ad75-9a41e922dc29',
    },
  },
};
