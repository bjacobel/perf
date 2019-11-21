import { Arguments, CommandBuilder } from 'yargs';
import Table, { HorizontalAlignment, HorizontalTableRow } from 'cli-table3';
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

export const command = 'analyze-assets [compareBaseline] [emitBaseline]';

export const describe =
  'display sizes of emitted assets, optionally compared to a previous run';

export const builder: CommandBuilder = {
  compareBaseline: {
    type: 'boolean',
  },
  emitBaseline: {
    type: 'boolean',
  },
};

const prettyKb = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  const kb = (1.0 * bytes) / 1024;
  return `${kb.toFixed(2)} kB`;
};

const prettyDiff = (bytes: number, bytesPrime: number): string => {
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
  const matchingBaseline = (name: string): { size: number } | false => {
    const bail = false;
    if (!baseline) return bail;
    if (!baseline.assets) return bail;
    return baseline.assets.find((asset) => asset.name === name) ?? bail;
  };
  return (stats.assets ?? [])
    .filter((asset) => !/\.map$/.test(asset.name))
    .map(({ name, size }) =>
      Object.assign(
        {
          name,
          size: prettyKb(size),
        },
        matchingBaseline(name)
          ? {
              diff: prettyDiff(
                size,
                (matchingBaseline(name) as { size: number }).size,
              ),
            }
          : {},
      ),
    );
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
  const baselinePath = path.join(os.tmpdir(), 'baseline.json');

  if (args.compareBaseline) {
    baseline = JSON.parse(await fs.readFile(baselinePath, 'utf-8'));
  }

  const stats = await webpackCompile({
    // Remove hashes from filenames, even though we're building in prodmode
    // @TODO: CSS files are still hashed, because that's set inside MiniCssExtractPlugin instantiation
    output: {
      filename: '[name].js',
    },
  });

  // @ts-ignore 2345
  const table = new Table({
    head: render(
      Object.assign(
        {
          name: chalk.magenta('asset name'),
          size: chalk.magenta('parsed size'),
        },
        baseline ? { diff: chalk.magenta('baseline diff') } : {},
      ),
    ),
  });

  table.push(...extractSizes(stats, baseline).map(render));

  console.log(table.toString());

  if (args.emitBaseline) {
    await fs.writeFile(baselinePath, JSON.stringify(stats));
    console.log(
      `Emitted baseline stats file. Run next time with --compare-baseline to diff against this point in time.`,
    );
  }
};
