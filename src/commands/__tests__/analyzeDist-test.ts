import { mocked } from 'ts-jest/utils';
import { promises } from 'fs';

import * as analyzeDist from '../analyzeDist';
import yargsPromise from '../../utils/yargsPromise';
import { rreaddir, DirectoryReport } from '../../utils/rreaddir';
import directoryReport from './directoryReport.json';

jest.mock('../../utils/rreaddir');
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  promises: {
    writeFile: jest.fn(() => Promise.resolve()),
    readFile: jest.fn(() => Promise.resolve('{}')),
  },
}));

describe('analyze-dist command', () => {
  beforeEach(() => {
    console.log = jest.fn();
    mocked(rreaddir).mockReturnValueOnce(
      Promise.resolve(directoryReport as DirectoryReport[]),
    );
  });

  it('reports a table of stats', async () => {
    await yargsPromise(analyzeDist, 'analyze-dist path');

    expect(console.log).toHaveBeenCalledTimes(1);
    expect(mocked(console.log).mock.calls[0][0]).toMatchSnapshot();
  });

  it('writes a baseline if sent --emit-baseline', async () => {
    await yargsPromise(analyzeDist, 'analyze-dist path --emit-baseline');

    expect(promises.writeFile).lastCalledWith(
      expect.any(String),
      JSON.stringify({
        name: 'path',
        children: directoryReport,
        size: 0,
      }),
    );
  });

  it('reports brotli sizes if sent --brotli', async () => {
    await yargsPromise(analyzeDist, 'analyze-dist path --brotli');

    expect(console.log).toHaveBeenCalledTimes(1);
    expect(mocked(console.log).mock.calls[0][0]).toMatchSnapshot();
  });

  it('reports a table of stats compared to a baseline', async () => {
    mocked(promises.readFile).mockReturnValueOnce(
      Promise.resolve(
        JSON.stringify({
          name: 'path',
          children: directoryReport,
          size: 0,
        }),
      ),
    );

    await yargsPromise(analyzeDist, 'analyze-dist path --compare-baseline');

    expect(mocked(console.log).mock.calls[0][0]).toMatchSnapshot();
  });
});
