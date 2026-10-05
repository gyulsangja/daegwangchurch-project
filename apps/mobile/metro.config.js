const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const defaults = config.resolver.blockList;
config.resolver.blockList = [
  ...(Array.isArray(defaults) ? defaults : defaults ? [defaults] : []),
  // Local PostgreSQL binaries/data and web build output are not mobile sources.
  /[/\\](?:test-results|playwright-report|dist-release-check|\.next)[/\\].*/,
];

module.exports = config;
