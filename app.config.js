// Ensure Expo CLI reads this config and sets web.output to 'static'
const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

module.exports = {
  expo: {
    name: 'Agente mkesh',
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
      config: {
        googleMapsApiKey,
      },
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
        foregroundImage: './assets/logomkesh-adaptive-icon.png',
        backgroundColor: '#FFFFFF',
      },
      config: {
        googleMaps: {
          apiKey: googleMapsApiKey,
        },
      },
    },
    web: {
      output: 'single',
    },
    icon: './assets/logomkesh-icon.png',
    plugins: [
      './plugins/withNetworkSecurityConfig',
    ],
    extra: {
      eas: {
        projectId: '1d5f13c3-18c6-418b-ad75-9a41e922dc29',
      },
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || '',
      googleMapsApiKey,
    },
  },
};
