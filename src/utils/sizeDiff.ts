import Table, { HorizontalAlignment, HorizontalTableRow } from 'cli-table3';
import chalk from 'chalk';

export interface TableEntry {
  name: string;
  size: string | number;
  diff?: string | number;
}

export const prettyKb = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  const kb = (1.0 * bytes) / 1024;
  return `${kb.toFixed(2)} kB`;
};

export const prettyDiff = (bytes: number, bytesPrime: number): string => {
  const diff = bytesPrime - bytes;
  if (diff === 0) return chalk.gray('unchanged');
  const grow = diff >= 0;
  return (grow ? chalk.green : chalk.red).call(
    undefined,
    `${grow ? '-' : '+'}${prettyKb(Math.abs(diff))}`,
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

export const renderTable = (baseline: boolean, rows: TableEntry[]): void => {
  // eslint-disable-next-line
  // @ts-ignore 2345
  const table = new Table({
    head: render(
      Object.assign(
        {
          name: chalk.magenta('name'),
          size: chalk.magenta('size'),
        },
        baseline ? { diff: chalk.magenta('baseline diff') } : {},
      ),
    ),
  });

  table.push(...rows.map(render));

  console.log(table.toString());
};
