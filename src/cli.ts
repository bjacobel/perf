import yargs from 'yargs';
import path from 'path';

import failureHandler from './utils/failureHandler';

const main = (): void => {
  yargs
    .commandDir(path.join(__dirname, 'commands'), {
      extensions: ['js', 'ts'],
    })
    .demandCommand(1, 'Please provide a command.')
    .help()
    .fail(failureHandler).argv;
};

(() => {
  if (require.main === module) {
    main();
  }
})();

export default main;
