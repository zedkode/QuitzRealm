import { copyFile, mkdir, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const workersDirectory = resolve(scriptDirectory, '..');
const sourceSchema = resolve(
  workersDirectory,
  '..',
  'api',
  'prisma',
  'schema.prisma',
);
const temporaryDirectory = resolve(workersDirectory, '.prisma-schema');
const temporarySchema = resolve(temporaryDirectory, 'schema.prisma');
const prismaCli = resolve(
  workersDirectory,
  'node_modules',
  'prisma',
  'build',
  'index.js',
);

await mkdir(temporaryDirectory, { recursive: true });
try {
  await copyFile(sourceSchema, temporarySchema);
  const result = spawnSync(
    process.execPath,
    [prismaCli, 'generate', '--schema', temporarySchema],
    { cwd: workersDirectory, stdio: 'inherit', env: process.env },
  );
  if (result.status !== 0) process.exitCode = result.status ?? 1;
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
