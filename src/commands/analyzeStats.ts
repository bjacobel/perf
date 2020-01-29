import { Arguments, CommandBuilder } from 'yargs';
import os from 'os';
import path from 'path';
import { promises } from 'fs';
import { Stats } from 'webpack';
const fs = promises;

import webpackCompile from '../utils/webpackCompile';
import {
  prettyKb,
  prettyDiff,
  renderTable,
  TableEntry,
} from '../utils/sizeDiff';

export const command = 'analyze-stats [compareBaseline] [emitBaseline]';

export const describe =
  'display sizes reported by compilation stats file, optionally compared to a previous run';

export const builder: CommandBuilder = {
  compareBaseline: {
    type: 'boolean',
  },
  emitBaseline: {
    type: 'boolean',
  },
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

  renderTable(!!baseline, extractSizes(stats, baseline));

  if (args.emitBaseline) {
    await fs.writeFile(baselinePath, JSON.stringify(stats));
    console.log(
      `Emitted baseline stats file. Run next time with --compare-baseline to diff against this point in time.`,
    );
  }
};
