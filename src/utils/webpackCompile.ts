import {
  Stats,
  Compiler,
  Configuration,
  ConfigurationFactory,
  MultiConfigurationFactory,
} from 'webpack';
import path from 'path';
import merge from 'webpack-merge';

// polymorphism is evil
type AmbiguousConfig =
  | Configuration
  | Configuration[]
  | ConfigurationFactory
  | MultiConfigurationFactory;

// webpack.config.js can have a terrifying array of export types. This normalizes them all to an array.
const getConfig = async (ambi: AmbiguousConfig): Promise<Configuration[]> => {
  const appConfigs: Configuration[] = [];

  if (typeof ambi === 'object') {
    if (ambi.hasOwnProperty('length')) {
      return Promise.resolve(ambi as Configuration[]);
    } else {
      appConfigs.push(ambi as Configuration);
    }
  } else if (typeof ambi === 'function') {
    const factoryResult = await ambi(
      { production: true },
      { mode: 'production' },
    );
    appConfigs.push(...(await getConfig(factoryResult)));
  }

  return appConfigs;
};

export default async (...extraConfig: Configuration[]) => {
  const cwd = process.cwd();

  const appConfigs = await getConfig(
    require(path.join(cwd, 'webpack.config.js')),
  );

  const finalConfigs = appConfigs.map((config) =>
    merge(config, ...extraConfig, {
      optimization: {
        noEmitOnErrors: true,
      },
    }),
  );

  const webpack: (c: Configuration[]) => Compiler = require(path.join(
    cwd,
    'node_modules/webpack',
  ));

  const compiler = webpack(finalConfigs);
  return new Promise((resolve, reject) => {
    compiler.run((err: Error, stats: Stats) => {
      if (err || stats.hasErrors()) {
        reject(err || new Error(stats.toJson().errors.join('\n')));
      } else {
        resolve(stats.toJson().assets);
      }
    });
  });
};
