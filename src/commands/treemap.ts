import { Argv, CommandBuilder } from 'yargs';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import open from 'open';
import path from 'path';
import os from 'os';

import webpackCompile from '../utils/webpackCompile';

export const command = 'treemap';

export const describe =
  'generate a treemap for the webpack bundle and open it in the browser';

export const builder: CommandBuilder = {};

export const handler = async (argv: Argv) => {
  const reportFilename = path.join(os.tmpdir(), 'report.html');
  await webpackCompile({
    plugins: [
      new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        logLevel: 'warn',
        reportFilename
      }),
    ]
  })

  await open(reportFilename, { wait: false });
};
