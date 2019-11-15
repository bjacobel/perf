declare module 'lighthouse';

interface Options {
  port: number;
  output: 'html' | 'json';
}

interface Result {
  report: string;
}

export default function (url: string, opts: Options): Promise<Result>;
