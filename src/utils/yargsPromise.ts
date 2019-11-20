import yargs, { Argv, CommandModule } from 'yargs';

export default async (cmd: CommandModule, args: string = '') => {
  return new Promise((resolve, reject) =>
    yargs
      .command(cmd)
      .fail(reject)
      .parse(args, (err: Error, _argv: Argv, output: string) => {
        if (err) {
          reject(err);
        } else {
          resolve(output);
        }
      }),
  );
};
