// Ensure Expo CLI reads this config and sets web.output to 'static'
const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';
const isPilot = process.env.APP_VARIANT === 'pilot';

module.exports = {
  expo: {
    name: isPilot ? 'Mkesh agente Pilot' : 'Mkesh agente',
    slug: 'sirac',
    version: '1.0.1',
    orientation: 'portrait',
    scheme: isPilot ? 'sirac-pilot' : 'sirac',
    userInterfaceStyle: 'automatic',
    platforms: ['android', 'ios', 'web'],
    runtimeVersion: { policy: 'sdkVersion' },
    updates: {
      fallbackToCacheTimeout: 0,
      url: 'https://u.expo.dev/5359f0b9-c61f-4c70-9f90-d28bcdd89e45',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: isPilot ? 'com.sirac.app.pilot' : 'com.sirac.app',
      buildNumber: '1.0.1',
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
      package: isPilot ? 'com.sirac.app.pilot' : 'com.sirac.app',
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
        backgroundColor: '#F0CF12',
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
        projectId: '5359f0b9-c61f-4c70-9f90-d28bcdd89e45',
      },
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || '',
      googleMapsApiKey,
    },
  },
};
