import { Arguments, CommandBuilder } from 'yargs';
import os from 'os';
import path from 'path';
import fsSync from 'fs';
const fs = fsSync.promises;

import {
  prettyKb,
  prettyDiff,
  renderTable,
  TableEntry,
} from '../utils/sizeDiff';
import { rreaddir, DirectoryReport } from '../utils/rreaddir';

export const command =
  'analyze-dist <dir> [compareBaseline] [emitBaseline] [brotli]';

export const describe =
  'display sizes of built assets in dist, optionally compared to a previous run';

export const builder: CommandBuilder = {
  dir: {
    type: 'string',
  },
  compareBaseline: {
    type: 'boolean',
  },
  emitBaseline: {
    type: 'boolean',
  },
  brotli: {
    type: 'boolean',
    description:
      'show sizes of files compressed with brotli in addition to current disk sizes',
    default: false,
  },
};

const tableEntry = (
  stats: DirectoryReport,
  baseline: DirectoryReport | undefined,
  showCompressedSize = false,
) => {
  const matchingBaseline = (
    name: string,
  ): { size: number; compressedSize?: number } | false => {
    const bail = false;
    if (!baseline) return bail;
    if (!baseline.children) return bail;
    return baseline.children.find((file) => file.name === name) ?? bail;
  };
  return (stats.children ?? [])
    .filter((file) => !/\.map$/.test(file.name))
    .filter((file) => file.size)
    .map(({ name, size, compressedSize }) =>
      Object.assign(
        {
          name,
          size: prettyKb(size),
        },
        showCompressedSize
          ? { compressedSize: prettyKb(compressedSize || 0) }
          : {},
        matchingBaseline(name)
          ? {
              diff: prettyDiff(
                size,
                (matchingBaseline(name) as { size: number }).size,
              ),
            }
          : {},
        matchingBaseline(name) && showCompressedSize
          ? {
              compressedSizeDiff: prettyDiff(
                compressedSize || 0,
                (matchingBaseline(name) as { compressedSize: number })
                  .compressedSize,
              ),
            }
          : {},
      ),
    );
};

const extractSizes = (
  stats: DirectoryReport,
  baseline: DirectoryReport | undefined,
  showCompressedSize = false,
): TableEntry[] => {
  const childSizes: TableEntry[] = (stats.children ?? [])
    .map((child, i) =>
      extractSizes(
        child,
        baseline && baseline.children && baseline.children[i],
        showCompressedSize,
      ),
    )
    .reduce((a, b) => [...a, ...b], []);

  return [...tableEntry(stats, baseline, showCompressedSize), ...childSizes];
};

export const handler = async (args: Arguments): Promise<void> => {
  let baseline: DirectoryReport | undefined;
  const baselinePath = path.join(os.tmpdir(), 'baseline.json');

  if (args.compareBaseline) {
    baseline = JSON.parse(await fs.readFile(baselinePath, 'utf-8'));
  }

  const stats = {
    name: args.dir as string,
    children: await rreaddir(
      args.dir as string,
      undefined,
      args.brotli as boolean,
    ),
    size: 0,
  };

  renderTable(
    !!baseline,
    extractSizes(stats, baseline, !!args.brotli),
    !!args.brotli,
  );

  if (args.emitBaseline) {
    await fs.writeFile(baselinePath, JSON.stringify(stats));
    console.log(
      `Emitted baseline stats file. Run next time with --compare-baseline to diff against this point in time.`,
    );
  }
};
