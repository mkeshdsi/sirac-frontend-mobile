// Ensure Expo CLI reads this config and sets web.output to 'static'
module.exports = {
  expo: {
    name: 'SIRAC',
    slug: 'sirac',
    version: '1.0.0',
    orientation: 'portrait',
    scheme: 'sirac',
    userInterfaceStyle: 'automatic',
    platforms: ['android', 'ios', 'web'],
    runtimeVersion: { policy: 'sdkVersion' },
    updates: {
      fallbackToCacheTimeout: 0,
      url: 'https://u.expo.dev/1d5f13c3-18c6-418b-ad75-9a41e922dc29',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.sirac.app',
      buildNumber: '1.0.0',
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          'This app needs access to location to get the position of the banca.',
        NSLocationAlwaysAndWhenInUseUsageDescription:
          'This app needs access to location to get the position of the banca.',
      },
    },
    android: {
      package: 'com.sirac.app',
      versionCode: 1,
      usesCleartextTraffic: true,
      permissions: [
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.CAMERA',
        'android.permission.READ_MEDIA_IMAGES',
        'android.permission.READ_EXTERNAL_STORAGE',
      ],
      adaptiveIcon: {
        foregroundImage: './logo_png.png',
        backgroundColor: '#FFFFFF',
      },
    },
    web: {
      output: 'single',
    },
    icon: './logo_png.png',
    plugins: [
      './plugins/withNetworkSecurityConfig',
    ],
    extra: {
      eas: {
        projectId: '1d5f13c3-18c6-418b-ad75-9a41e922dc29',
      },
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || '',
    },
  },
};
