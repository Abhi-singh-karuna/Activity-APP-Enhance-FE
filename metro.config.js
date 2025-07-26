const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Use the new serializer
config.resolver.assetExts.push("cjs");

// Disable Watchman to avoid permission issues
config.watchFolders = [];
config.resolver.useWatchman = false;

module.exports = config;
