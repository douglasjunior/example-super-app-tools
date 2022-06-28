#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

const rootPackageJson = require('./read-package-json');
const config = require('./config');

const rootDependenciesNames = [
  ...Object.keys(rootPackageJson.dependencies || {}),
  ...Object.keys(rootPackageJson.devDependencies || {}),
]

function getInvalidDependencies(modulePackageJson) {
  return rootDependenciesNames
    .map(dependencyName => {
      const rootVersion = rootPackageJson.dependencies?.[dependencyName] || rootPackageJson.devDependencies?.[dependencyName]
      const moduleVersion = modulePackageJson.dependencies?.[dependencyName] || modulePackageJson.devDependencies?.[dependencyName]
      return {
        dependencyName,
        rootVersion,
        moduleVersion
      }
    })
    .filter(({ rootVersion, moduleVersion }) => {
      return rootVersion && moduleVersion && rootVersion !== moduleVersion;
    });
}

function validateDependencies() {
  const invalidDependencies = rootDependenciesNames
    .filter(moduleName => moduleName.startsWith(config.modulesPrefix))
    .map(moduleName => {
      const modulePath = path.resolve(config.rootPath, 'node_modules', moduleName);
      const packagePath = path.resolve(modulePath, 'package.json');
      const package = JSON.parse(fs.readFileSync(packagePath, { encoding: 'utf-8' }))
      return {
        moduleName,
        invalidDependencies: getInvalidDependencies(package)
      }
    })
    .filter(({ invalidDependencies }) => invalidDependencies.length);

  if (invalidDependencies.length) {
    invalidDependencies.forEach(({ moduleName, invalidDependencies }) => {
      console.error(
        '\x1b[31mModule',
        '\x1b[35m"' + moduleName + '"\x1b[31m',
        'contains dependencies with invalid versions:\x1b[0m',
      );
      console.log(
        '↳\x1b[35m',
        invalidDependencies.map(({
          dependencyName,
          rootVersion,
          moduleVersion
        }) => `${dependencyName}: expected "${rootVersion}", but got "${moduleVersion}"`)
          .join(','),
        "\x1b[0m",
      )

    })
    process.exit(1);
  }

  process.exit(0);
}

validateDependencies();
