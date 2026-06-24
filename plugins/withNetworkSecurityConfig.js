// Expo Config Plugin: adds network_security_config.xml to allow HTTP cleartext traffic
const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const XML_CONTENT = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <base-config cleartextTrafficPermitted="true">
    <trust-anchors>
      <certificates src="system" />
    </trust-anchors>
  </base-config>
</network-security-config>
`;

function withNetworkSecurityConfig(config) {
  // Step 1: write the XML file into android/app/src/main/res/xml/
  config = withDangerousMod(config, [
    'android',
    async (cfg) => {
      const xmlDir = path.join(cfg.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res', 'xml');
      fs.mkdirSync(xmlDir, { recursive: true });
      fs.writeFileSync(path.join(xmlDir, 'network_security_config.xml'), XML_CONTENT, 'utf8');
      return cfg;
    },
  ]);

  // Step 2: reference it in AndroidManifest.xml <application>
  config = withAndroidManifest(config, async (cfg) => {
    const app = cfg.modResults.manifest.application?.[0];
    if (app) {
      app.$['android:networkSecurityConfig'] = '@xml/network_security_config';
      app.$['android:usesCleartextTraffic'] = 'true';
    }
    return cfg;
  });

  return config;
}

module.exports = withNetworkSecurityConfig;
