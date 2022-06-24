#!/usr/bin/env node

const packageJson = require('../package.json');
const {exec} = require('child_process');

const MODULES_PREFFIX = 'example-super-app';

const modulesToUpdate = Object.keys(packageJson.dependencies)
  .filter(packageName => packageName.startsWith(MODULES_PREFFIX))
  .map(packageName => {
    const packageVersion = packageJson.dependencies[packageName];
    return packageName + '@' + packageVersion;
  })
  .join(' ');

const command = 'yarn upgrade ' + modulesToUpdate;

console.log('running:', command);

const yarnProcess = exec(command);

yarnProcess.stdout.pipe(process.stdout);
yarnProcess.stderr.pipe(process.stdout);

yarnProcess.on('exit', function (code) {
  process.exit(code);
});
