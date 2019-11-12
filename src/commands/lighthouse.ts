import { promises } from 'fs';
import path from 'path';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import Koa from 'koa';
import staticfiles from 'koa-static';
import compress from 'koa-compress';
import opn from 'open';
import { Argv, CommandBuilder } from 'yargs';
import http2 from 'http2';

import { key, cert, caCrt } from '../utils/ssl';

const fs = promises;

const webpackCompile = async (webpack, config) => {
  const compiler = webpack(config);
  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err || stats.hasErrors()) {
        reject(err || stats.toJson().errors);
      } else {
        resolve(stats.toJson().assets);
      }
    });
  });
};

export const command = 'lighthouse';

export const describe =
  'runs the Lighthouse perf tool and opens results in the browser';

export const builder: CommandBuilder = {};

export const handler = async (argv: Argv) => {
  const cwd = process.cwd();
  const config = require(path.join(cwd, 'webpack.config.js'))({
    production: true,
  });
  const webpack = require(path.join(cwd, 'node_modules/webpack'));

  const serverPort = 8888;
  const reportPath = '/tmp/lighthouse.html';

  const app = new Koa();

  try {
    console.log('compiling app');
    await webpackCompile(webpack, config);

    console.log('serving app');
    app.use(compress());
    app.use(
      staticfiles(path.join(cwd, 'dist'), {
        maxage: 31536000000,
      }),
    );

    const server = http2
      .createSecureServer(
        {
          ca: await caCrt(),
          key: await key(),
          cert: await cert(),
        },
        app.callback(),
      )
      .listen(serverPort);

    console.log('testing app');
    const chrome = await chromeLauncher.launch({
      chromeFlags: ['--ignore-certificate-errors', '--headless'],
    });
    const { report } = await lighthouse(`https://localhost:${serverPort}`, {
      port: chrome.port,
      output: 'html',
    });

    console.log('showing results');
    await fs.writeFile(reportPath, report);
    await opn(reportPath, { wait: false });

    console.log('shutting down');
    await server.close();
    await chrome.kill();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};
