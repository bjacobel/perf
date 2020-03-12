import path from 'path';
import fsSync from 'fs';
const fs = fsSync.promises;
import { compress } from 'brotli';

export interface DirectoryReport {
  children: DirectoryReport[];
  name: string;
  size: number;
  compressedSize?: number;
}

export const rreaddir = async function(
  dirpath: string,
  top?: string,
  checkCompressedSize = false,
): Promise<DirectoryReport[]> {
  const items = await fs.readdir(dirpath);
  return Promise.all(
    items.map(async (shortName) => {
      const fullName = path.join(dirpath, shortName);
      const relativeName = path.relative(top || dirpath, fullName);

      const stats = await fs.lstat(fullName);

      if (stats.isDirectory()) {
        const children = await rreaddir(
          fullName,
          top || dirpath,
          checkCompressedSize,
        );
        return { name: relativeName, children, size: 0, compressedSize: 0 };
      } else {
        let compressedSize = 0;
        if (checkCompressedSize) {
          const buf = await fs.readFile(fullName);
          const compressedBuf = compress(buf);
          compressedSize = compressedBuf.byteLength;
        }

        return {
          name: relativeName,
          size: stats.size,
          ...(checkCompressedSize ? { compressedSize } : {}),
          children: [],
        };
      }
    }),
  );
};
