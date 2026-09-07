/*
 * marked v18 ships its primary build as ESM. Jest's CommonJS runtime cannot
 * load that entrypoint on the supported Node 22 baseline, while the package's
 * UMD artifact contains the same parser. Evaluate that artifact in an isolated
 * CommonJS-like sandbox for integration tests.
 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const packageJson = require.resolve('marked/package.json');
const umdPath = path.join(path.dirname(packageJson), 'lib', 'marked.umd.js');
const sandbox = { module: { exports: {} }, exports: {}, globalThis: {} };
sandbox.globalThis = sandbox;
vm.runInNewContext(fs.readFileSync(umdPath, 'utf8'), sandbox, { filename: umdPath });
module.exports = sandbox.module.exports;
