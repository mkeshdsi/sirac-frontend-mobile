// Ensure Expo CLI reads this config and sets web.output to 'static'
module.exports = {
  expo: {
    name: 'SIRAC',
    slug: 'sirac',
    version: '1.0.0',
    orientation: 'portrait',
    scheme: 'sirac',
    userInterfaceStyle: 'light',
    platforms: ['android', 'ios', 'web'],
    updates: {
      fallbackToCacheTimeout: 0,
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
    },
    android: {
      permissions: [],
    },
    web: {
      output: 'static',
    },
  },
};
