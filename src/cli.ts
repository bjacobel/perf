import yargs from 'yargs';
import path from 'path';

import failureHandler from './utils/failureHandler';

const main = () => {
  yargs
    .commandDir(path.join(__dirname, 'commands'), {
      extensions: ['js', 'ts'],
    })
    .demandCommand(1, 'Please provide a command.')
    .help()
    // @ts-ignore 2345
    .fail(failureHandler).argv;
};

(() => {
  if (require.main === module) {
    main();
  }
})();

export default main;
