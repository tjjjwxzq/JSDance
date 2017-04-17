import webpack from 'webpack';
import path from 'path';

// Paths
const ENTRY_PATH = './src/js/app.js';
const JS_PATH = path.join(__dirname, 'src/js');
const GLSL_PATH = path.join(__dirname, 'src/glsl');
const ASSET_PATH = path.join(__dirname, 'assets');
const STYLESHEET_PATH = path.join(__dirname, 'assets/stylesheets');
const NODE_MODULES_PATH = path.join(__dirname, 'node_modules');
const OUTPUT_PATH = path.join(__dirname, 'build');

// Dev environment
const env = 'dev';
const time = Date.now();
const devtool = 'cheap-eval-source-map';
const plugins = [
  new webpack.NoEmitOnErrorsPlugin(),
];

console.log('Webpack build - ENV: ' + env + ' V: ' + time);
console.log(' -OUTPUT_PATH ', OUTPUT_PATH);
console.log(' -JS_PATH ', JS_PATH);
console.log(' -NODE_MODULES_PATH ', NODE_MODULES_PATH);

export default {
  stats: {
    colors: true,
  },
  devtool: devtool,
  devServer: {
    contentBase: 'build',
  },
  entry: [
    ENTRY_PATH,
  ],
  // don't need to specify publicPath
  output: {
    path: OUTPUT_PATH,
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        include: JS_PATH,
        exclude: [/node_modules/],
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['env',
              {
                'targets': {
                  'browsers': ['last 2 versions'],
                },
              }],
            ],
          },
        },
      },
      {
        test: /soundjs\.js$/,
        include: JS_PATH,
        exclude: [/node_modules/],
        use: {
          loader: 'imports-loader?this=>window',
        },
      },
      {
        test: /\.glsl$/,
        include: GLSL_PATH,
        use: {
          loader: 'webpack-glsl-loader',
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(mtl|obj|json|png)$/,
        include: ASSET_PATH,
        exclude: OUTPUT_PATH,
        use: {
          loader: 'file-loader',
          options: {
            outputPath: '/assets/',
            name: '[name].[ext]',
          },
        },
      },
    ],
  },
  resolve: {
    modules: [
      JS_PATH,
      GLSL_PATH,
      NODE_MODULES_PATH,
      ASSET_PATH,
      STYLESHEET_PATH,
    ],
    alias: {
      'dat.gui': 'dat.gui/build/dat.gui.min.js',
    },
  },
  plugins: plugins,
};

// the `resolve` property allows us to specify multiple
// root folders from which out module imports will be
// resolved, so we don't need to use brittle relative imports
//
// set `resolve.alias` to prevent conflict in resolving dat.gui module
// since there exists `node_modules/dat.gui/src/dat/gui/index.js`
// as well `node_modules/dat.gui/build/dat.gui.js`
