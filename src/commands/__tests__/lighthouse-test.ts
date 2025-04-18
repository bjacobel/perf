import { promises } from 'fs';
import * as lighthouse from '../lighthouse';
import yargsPromise from '../../utils/yargsPromise';

jest.mock('../../utils/webpackCompile');
jest.mock('koa-static');
jest.mock('open');

describe('lighthouse runner', () => {
  beforeEach(() => {
    console.log = jest.fn();
    jest.spyOn(process, 'exit').mockImplementation();
    jest.spyOn(promises, 'writeFile');
  });

  it('writes out lighthouse report to disk', async () => {
    await yargsPromise(lighthouse, 'lighthouse'); // not sure why yargsPromise isn't working here like it does for the other tests
    expect(promises.writeFile).toHaveBeenCalledWith(
      '/tmp/lighthouse.html',
      expect.stringMatching('https://localhost:8888'),
    );
  }, 30000);
});
