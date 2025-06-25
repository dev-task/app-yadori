module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        '@tamagui/babel-plugin',
        {
          components: ['@yadori/ui'],
          config: './tamagui.config.ts',
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};