declare module 'brotli' {
  export interface Options {
    quality?: number;
    mode?: number;
    lgwin?: number;
  }
  export function compress(buffer: Buffer, options?: Options): Buffer;
}
