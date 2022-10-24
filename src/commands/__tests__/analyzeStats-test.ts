import { Stats } from 'webpack';
import { promises } from 'fs';

import * as analyzeStats from '../analyzeStats';
import webpackCompile from '../../utils/webpackCompile';
import yargsPromise from '../../utils/yargsPromise';

jest.mock('../../utils/webpackCompile');

const assets = (
  ...sizes: { [filename: string]: number }[]
): { name: string; size: number }[] =>
  sizes.map((size) => ({
    name: Object.keys(size)[0],
    size: Object.values(size)[0],
  }));

describe('analyze-stats command', () => {
  let fakeStats: Stats.ToJsonOutput;

  beforeEach(() => {
    jest.spyOn(promises, 'readFile');
    jest.spyOn(promises, 'writeFile');
    console.log = jest.fn();
    fakeStats = {
      assets: assets({ top: 2000 }),
      children: [
        { assets: assets({ small: 200 }, { big: 4000 }, { medium: 600 }) },
      ],
    } as Stats.ToJsonOutput;
    jest.mocked(webpackCompile).mockReturnValueOnce(Promise.resolve(fakeStats));
  });

  it('runs a webpack build and reports a table of stats', async () => {
    await yargsPromise(analyzeStats, 'analyze-stats');

    expect(console.log).toHaveBeenCalledTimes(1);
    expect(jest.mocked(console.log).mock.calls[0][0]).toMatchSnapshot();
  });

  it('writes a baseline if sent --emit-baseline', async () => {
    await yargsPromise(analyzeStats, 'analyze-stats --emit-baseline');

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
    jest
      .mocked(promises.readFile)
      .mockReturnValueOnce(Promise.resolve(JSON.stringify(baseline)));

    await yargsPromise(analyzeStats, 'analyze-stats --compare-baseline');

    expect(jest.mocked(console.log).mock.calls[0][0]).toMatchSnapshot();
  });
});
