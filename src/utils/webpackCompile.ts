import { Configuration, Stats, ConfigurationFactory, Compiler } from 'webpack';
import path from 'path';
import merge from 'webpack-merge';

type Config = Configuration | ConfigurationFactory;

export default async (...extraConfig: Configuration[]) => {
  const cwd = process.cwd();
  const config: Config = merge(require(path.join(cwd, 'webpack.config.js'))({
    production: true,
  }), ...extraConfig);
  const webpack: (c: Config) => Compiler = require(path.join(cwd, 'node_modules/webpack'));

  const compiler = webpack(config);
  return new Promise((resolve, reject) => {
    compiler.run((err: Error, stats: Stats) => {
      if (err || stats.hasErrors()) {
        reject(err || stats.toJson().errors);
      } else {
        resolve(stats.toJson().assets);
      }
    });
  });
};
