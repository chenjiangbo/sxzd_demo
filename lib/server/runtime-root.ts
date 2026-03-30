import path from 'node:path';

export function getWorkspaceRoot() {
  const cwd = process.cwd();
  const standaloneSuffix = `${path.sep}.next${path.sep}standalone`;
  if (cwd.endsWith(standaloneSuffix)) {
    return path.resolve(cwd, '..', '..');
  }
  return cwd;
}

export function getDemoCacheRoot() {
  return path.join(getWorkspaceRoot(), '.cache', 'demo-analysis');
}
