/* eslint-disable @typescript-eslint/no-var-requires */

import {
  Stats,
  Compiler,
  Configuration,
  ConfigurationFactory,
  MultiConfigurationFactory,
} from 'webpack';
import path from 'path';
import { merge } from 'webpack-merge';

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

export default async (
  ...extraConfig: Configuration[]
): Promise<Stats.ToJsonOutput> => {
  const cwd = process.cwd();

  let configFile;

  try {
    configFile = require(path.join(cwd, 'webpack.config.js'));
  } catch {
    try {
      configFile = require(path.join(cwd, 'webpack.config.ts')).default;
    } catch (e) {
      console.error(e);
      throw new Error(
        'Webpack config must exist at webpack.config.js or webpack.config.ts',
      );
    }
  }

  const appConfigs = await getConfig(configFile);

  const finalConfigs = appConfigs.map((config) =>
    merge(config, ...extraConfig, {
      optimization: {
        noEmitOnErrors: true,
      },
    }),
  );

  const webpack: (
    c: Configuration[],
  ) => Compiler = require(require.resolve('webpack', { paths: [cwd] }));

  const compiler = webpack(finalConfigs);
  return new Promise((resolve, reject) => {
    compiler.run((err: Error, stats: Stats) => {
      if (err || stats.hasErrors()) {
        reject(err || new Error(stats.toJson().errors.join('\n')));
      } else {
        resolve(stats.toJson());
      }
    });
  });
};
