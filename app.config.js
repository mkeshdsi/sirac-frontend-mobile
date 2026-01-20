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
    updates: {
      fallbackToCacheTimeout: 0,
    },
    assetBundlePatterns: ['**/*'],
    icon: './AdminLTELogo.png',
    ios: {
      supportsTablet: true,
      icon: './AdminLTELogo.png',
    },
    android: {
      package: 'com.sirac.mobile',
      permissions: [],
      adaptiveIcon: {
        foregroundImage: './AdminLTELogo.png',
        backgroundColor: '#FFFFFF',
      },
    },
    web: {
      output: 'static',
    },
    extra: {
      eas: {
        projectId: '1d5f13c3-18c6-418b-ad75-9a41e922dc29',
      },
    },
  },
};
