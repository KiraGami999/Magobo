const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Standard Expo + npm-workspaces monorepo setup: Metro must watch the
// workspace root (so edits to `packages/shared`/`packages/db` hot-reload)
// and resolve modules from both the app's and the root's `node_modules`.
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
