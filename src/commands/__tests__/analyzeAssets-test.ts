import { mocked } from 'ts-jest/utils';
import { Stats } from 'webpack';
import { promises } from 'fs';

import * as analyzeAssets from '../analyzeAssets';
import webpackCompile from '../../utils/webpackCompile';
import yargsPromise from '../../utils/yargsPromise';

jest.mock('../../utils/webpackCompile');
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  promises: {
    writeFile: jest.fn(() => Promise.resolve()),
    readFile: jest.fn(() => Promise.resolve('{}')),
  },
}));

const assets = (
  ...sizes: { [filename: string]: number }[]
): { name: string; size: number }[] =>
  sizes.map((size) => ({
    name: Object.keys(size)[0],
    size: Object.values(size)[0],
  }));

describe('analyze-assets command', () => {
  let fakeStats: Stats.ToJsonOutput;

  beforeEach(() => {
    console.log = jest.fn();
    fakeStats = {
      assets: assets({ top: 2000 }),
      children: [
        { assets: assets({ small: 200 }, { big: 4000 }, { medium: 600 }) },
      ],
    } as Stats.ToJsonOutput;
    mocked(webpackCompile).mockReturnValueOnce(Promise.resolve(fakeStats));
  });

  it('runs a webpack build and reports a table of stats', async () => {
    await yargsPromise(analyzeAssets, 'analyze-assets');

    expect(console.log).toHaveBeenCalledTimes(1);
    expect(mocked(console.log).mock.calls[0][0]).toMatchSnapshot();
  });

  it('writes a baseline if sent --emit-baseline', async () => {
    await yargsPromise(analyzeAssets, 'analyze-assets --emit-baseline');

    expect(promises.writeFile).lastCalledWith(
      expect.any(String),
      JSON.stringify(fakeStats),
    );
  });

  it('runs a webpack build and reports a table of stats compared to a baseline', async () => {
    const baseline = {
      assets: assets({ top: 7000 }),
      children: [{ assets: assets({ big: 4000 }, { medium: 205 }) }],
    } as Stats.ToJsonOutput;
    mocked(promises.readFile).mockReturnValueOnce(
      Promise.resolve(JSON.stringify(baseline)),
    );

    await yargsPromise(analyzeAssets, 'analyze-assets --compare-baseline');

    expect(mocked(console.log).mock.calls[0][0]).toMatchSnapshot();
  });
});
