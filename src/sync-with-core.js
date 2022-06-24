#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const chokidar = require('chokidar');

class SyncError extends Error {
  constructor(message) {
    super(message);
  }
}

const FATAL_ERROR = new SyncError(
  'Não foi possível conectar, certifique-se de que o metro está em execução no "core" e escutando na porta 8081.',
);

const modulePath = process.cwd();
const packageJsonPath = path.resolve(modulePath, 'package.json');

if (!fs.existsSync(packageJsonPath)) {
  throw new SyncError(
    'Certifique-se de executar o comando "yarn sync-with-core" na raiz do projeto.',
  );
}

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, { encoding: 'utf-8' }))

function ensureDirectoryExistence(dirPath) {
  const dirname = path.dirname(dirPath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
}

function startSync(corePath) {
  const linkedModulePath = path.resolve(
    corePath,
    'node_modules',
    packageJson.name,
  );

  function getLinkedFilePath(originalPath) {
    return originalPath.replace(modulePath, linkedModulePath);
  }

  function copyAddedOrChangedFile(originalPath) {
    const tempUpdatedPath = getLinkedFilePath(originalPath);
    ensureDirectoryExistence(tempUpdatedPath);
    fs.copyFileSync(originalPath, tempUpdatedPath);
  }

  function unlinkDeletedFile(originalPath) {
    const tempUpdatedPath = getLinkedFilePath(originalPath);
    fs.unlinkSync(tempUpdatedPath);
  }

  const watcher = chokidar.watch(modulePath, {
    // ignore dotfiles, nome_modules, android and ios folders
    ignored: /((^|[/\\])\..|__tests__|node_modules|android|ios)/,
    ignoreInitial: false,
    awaitWriteFinish: {
      pollInterval: 500,
      stabilityThreshold: 500,
    },
  });

  watcher
    .on('add', originalPath => {
      console.log('\x1b[34m', `Added file: ${originalPath}`, '\x1b[0m');
      copyAddedOrChangedFile(originalPath);
    })
    .on('change', originalPath => {
      console.log('\x1b[32m', `Changed file: ${originalPath}`, '\x1b[0m');
      copyAddedOrChangedFile(originalPath);
    })
    .on('unlink', originalPath => {
      console.log('\x1b[35m', `Removed file: ${originalPath}`, '\x1b[0m');
      unlinkDeletedFile(originalPath);
    });
}

async function syncWithCore() {
  try {
    const response = await fetch(
      'http://localhost:8081/sync-local-module?' +
      new URLSearchParams({
        name: packageJson.name,
      }),
    );

    if (response.status === 404) {
      throw new SyncError(
        'Módulo ' + packageJson.name + ' não está instalado no projeto "core".',
      );
    }

    if (response.status !== 200) {
      throw FATAL_ERROR;
    }

    const corePath = await response.text();

    startSync(corePath);
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      throw FATAL_ERROR;
    }
    throw err;
  }
}

(async () => {
  try {
    await syncWithCore();
  } catch (err) {
    if (err instanceof SyncError) {
      console.error('Erro: ' + err.message);
      return;
    }
    console.error(err);
  }
})();
