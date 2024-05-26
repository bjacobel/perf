import chalk from 'chalk';
import dedent from 'dedent';
import { Argv } from 'yargs';

export default (msg: string, err: Error, yargs: Argv): void => {
  console.log(dedent`
    ${chalk.bgRed('Error:')} ${
      msg || (err && err.message ? err.message : 'unknown')
    }

  Correct usage for this command is described below:
  ${chalk`{grey -----------------------------------------------------------------}`}

  ${yargs.help().toString()}\n
  `);
  process.exit(1);
};
