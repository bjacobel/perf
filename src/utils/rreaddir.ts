import path from 'path';
import fsSync from 'fs';
const fs = fsSync.promises;

export interface DirectoryReport {
  children: DirectoryReport[];
  name: string;
  size: number;
}

export const rreaddir = async function(
  dirpath: string,
  top?: string,
): Promise<DirectoryReport[]> {
  const items = await fs.readdir(dirpath);
  return Promise.all(
    items.map(async (shortName) => {
      const fullName = path.join(dirpath, shortName);
      const relativeName = path.relative(top || dirpath, fullName);

      const stats = await fs.lstat(fullName);
      if (stats.isDirectory()) {
        const children = await rreaddir(fullName, top || dirpath);
        return { name: relativeName, children, size: 0 };
      } else {
        return {
          name: relativeName,
          size: stats.size,
          children: [],
        };
      }
    }),
  );
};
