import path from 'path';

const staticfiles = jest.requireActual('koa-static');

export default () =>
  staticfiles(path.join(__dirname, '../data/mocks/webpack-output'));
