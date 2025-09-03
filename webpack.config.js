const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/background/index.ts',
  output: {
    filename: 'background.js',
    path: path.resolve(__dirname, 'out'),
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        options: {
          configFile: 'tsconfig.chrome.json'
        },
        exclude: /node_modules/,
      },
    ],
  },
};
