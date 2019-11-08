import fs from 'fs';
import path from 'path';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import Koa from 'koa';
import staticfiles from 'koa-static';
import compress from 'koa-compress';
import opn from 'open';
import { Argv, CommandBuilder } from 'yargs';

const webpackCompile = async (webpack, config) => {
  const compiler = webpack(config);
  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err || stats.hasErrors()) reject(err || stats.toJson().errors);
      resolve(stats.toJson().assets);
    });
  });
};

export const command = 'lighthouse';

export const describe = 'runs the Lighthouse perf tool and opens results in the browser';

export const builder: CommandBuilder = {};

export const handler = async (argv: Argv) => {
  const cwd = process.cwd();
  const config = require(path.join(cwd, 'webpack.config.js'))({ production: true });
  const webpack = require(path.join(cwd, 'node_modules/webpack'));

  const serverPort = 8888;
  const reportPath = '/tmp/lighthouse.html';

  await webpackCompile(webpack, config);

  const server = new Koa();

  server.use(compress());
  server.use(
    staticfiles(path.join(__dirname, '../dist'), {
      maxage: 31536000000,
    })
  );

  await server.listen(serverPort);

  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  const { report } = await lighthouse(`http://localhost:${serverPort}`, {
    port: chrome.port,
    output: 'html',
  });

  await new Promise((resolve) => fs.writeFile(reportPath, report, () => resolve()));
  await opn(reportPath, { wait: false });

  await chrome.kill();
  return server;
};
