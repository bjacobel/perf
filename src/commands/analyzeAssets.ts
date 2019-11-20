import { Arguments, CommandBuilder } from 'yargs';
import Table, { HorizontalTableRow, HorizontalAlignment } from 'cli-table2';
import chalk from 'chalk';
import os from 'os';
import path from 'path';
import { promises } from 'fs';
import { Stats } from 'webpack';
const fs = promises;

import webpackCompile from '../utils/webpackCompile';

interface TableEntry {
  name: string;
  size: string | number;
  diff?: string | number;
}

export const command = 'analyze-assets [baselinePath] [emitBaseline]';

export const describe =
  'display sizes of emitted assets, optionally compared to a previous run';

export const builder: CommandBuilder = {
  baselinePath: {
    type: 'string',
    conflicts: 'emitBaseline',
  },
  emitBaseline: {
    type: 'boolean',
    conflicts: 'baselinePath',
  },
};

const prettyKb = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  const kb = (1.0 * bytes) / 1024;
  return `${kb.toFixed(2)} kB`;
};

const prettyDiff = (bytes: number, bytesPrime: number | undefined): string => {
  if (!bytesPrime) return chalk.yellow('absent');
  const diff = bytesPrime - bytes;
  if (diff === 0) return chalk.gray('unchanged');
  const grow = diff >= 0;
  return (grow ? chalk.green : chalk.red).call(
    undefined,
    `${grow ? '-' : '+'}${prettyKb(Math.abs(diff))}`,
  );
};

const tableEntry = (
  stats: Stats.ToJsonOutput,
  baseline: Stats.ToJsonOutput | undefined,
) => {
  const matchingBaseline = (name: string): { size: number | undefined } => {
    const bail = { size: undefined };
    if (!baseline) return bail;
    if (!baseline.assets) return bail;
    return baseline.assets.find((asset) => asset.name === name) ?? bail;
  };
  return (stats.assets ?? [])
    .filter((asset) => !/\.map$/.test(asset.name))
    .map(({ name, size }) => ({
      name,
      size: prettyKb(size),
      diff: prettyDiff(size, matchingBaseline(name).size),
    }));
};

const render = ({ name, size, diff }: TableEntry): HorizontalTableRow => {
  return [
    { content: name },
    { content: size, hAlign: 'right' as HorizontalAlignment },
    ...(diff
      ? [{ content: diff, hAlign: 'right' as HorizontalAlignment }]
      : []),
  ];
};

const extractSizes = (
  stats: Stats.ToJsonOutput,
  baseline: Stats.ToJsonOutput | undefined,
): TableEntry[] => {
  const childSizes: TableEntry[] = (stats.children ?? [])
    .map((child, i) => extractSizes(child, baseline && baseline.children![i]))
    .reduce((a, b) => [...a, ...b], []);

  return [...tableEntry(stats, baseline), ...childSizes];
};

export const handler = async (args: Arguments) => {
  let baseline: Stats.ToJsonOutput | undefined;

  if (args.baselinePath && typeof args.baselinePath === 'string') {
    baseline = JSON.parse(await fs.readFile(args.baselinePath, 'utf-8'));
  }

  const stats = await webpackCompile({
    // Remove hashes from filenames, even though we're building in prodmode
    // @TODO: CSS files are still hashed, because that's set inside MiniCssExtractPlugin instantiation
    output: {
      filename: '[name].js',
    },
  });

  const table = new Table({
    head: render({
      name: chalk.magenta('asset name'),
      size: chalk.magenta('parsed size'),
      diff: baseline && chalk.magenta('baseline diff'),
    }),
  });

  // @ts-ignore 2345
  table.push(...extractSizes(stats, baseline).map(render));

  console.log(table.toString());

  if (args.emitBaseline) {
    const baselinePath = path.join(os.tmpdir(), 'baseline.json');
    await fs.writeFile(baselinePath, JSON.stringify(stats));
    console.log(`emitted baseline file to ${baselinePath}`);
  }
};
