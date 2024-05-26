import { CommandBuilder } from 'yargs';
import { DuplicatesPlugin } from 'inspectpack/plugin';

import webpackCompile from '../utils/webpackCompile';

export const command = 'duplicates';

export const describe = 'find duplicate modules in your bundle';

export const builder: CommandBuilder = {};

export const handler = async (): Promise<void> => {
  try {
    await webpackCompile({
      plugins: [
        new DuplicatesPlugin({
          emitErrors: true,
        }),
      ],
    });
  } catch (e) {
    console.log(
      'Bundle duplicates found. Check out this doc for hints on how to resolve: https://github.com/FormidableLabs/inspectpack/blob/v4.7.1/README.md#fixing-bundle-duplicates',
    );
  }
};
