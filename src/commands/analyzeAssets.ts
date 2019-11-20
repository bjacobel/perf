import { Arguments, CommandBuilder } from 'yargs';
import Table, { HorizontalTableRow, HorizontalAlignment } from 'cli-table2';
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

const tableEntry = (
  stats: Stats.ToJsonOutput,
  baseline: Stats.ToJsonOutput | undefined,
) => {
  return (stats.assets ?? []).map(({ name, size }, i) => ({
    name,
    size,
    diff:
      baseline && baseline.assets!.find((asset) => asset.name === name)!.size,
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

  const stats = await webpackCompile();

  const table = new Table({
    head: render({
      name: 'asset name',
      size: 'parsed size',
      diff: baseline && 'baseline diff',
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
