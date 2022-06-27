#!/usr/bin/env node

const { exec } = require('child_process');
const packageJson = require('./read-package-json');

const MODULES_PREFFIX = 'example-super-app';

function getDependenciesList(dependencies) {
  return Object.keys(dependencies)
    .filter(packageName => packageName.startsWith(MODULES_PREFFIX))
    .map(packageName => {
      const packageVersion = dependencies[packageName];
      return packageName + '@' + packageVersion;
    })
    .join(' ')
}

function updateAppModules() {
  const modulesToUpdate = getDependenciesList(packageJson.dependencies);
  const devModulesToUpdate = getDependenciesList(packageJson.devDependencies);

  if (!modulesToUpdate.length && !devModulesToUpdate.length) {
    console.warn('No modules were found to update.')
    return process.exit(0);
  }

  const command = 'yarn upgrade ' + modulesToUpdate + ' ' + devModulesToUpdate + ' && yarn install';

  console.log('Running:', command);

  const yarnProcess = exec(command);

  yarnProcess.stdout.pipe(process.stdout);
  yarnProcess.stderr.pipe(process.stdout);

  yarnProcess.on('exit', function (code) {
    process.exit(code);
  });
}

updateAppModules();
