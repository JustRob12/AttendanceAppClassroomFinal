const { getDefaultConfig } = require('@expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

defaultConfig.resolver.blockList = [
  /node_modules\/[@]expo\/.vector-icons-[^/]+\/build\/vendor\/react-native-vector-icons\/Fonts/,
];

module.exports = defaultConfig; 