const {URL} = require('url');

const config = require('./config');
const packageJson = require('./read-package-json');

function isSyncRequest(uri) {
  return uri.pathname === '/sync-local-module';
}

function validateModuleName(moduleName) {
  return Boolean(packageJson.dependencies[moduleName]);
}

function metroHandleSyncRequest(Middleware, Server) {
  return (request, response, next) => {
    const uri = new URL(request.originalUrl, 'http://localhost');

    if (!isSyncRequest(uri)) {
      return Middleware(request, response, next);
    }

    const moduleName = uri.searchParams.get('name');

    if (!validateModuleName(moduleName)) {
      response.statusCode = 404;
      response.end();

      console.warn(
        '\x1b[35m',
        'Synchronization failed, dependency ' + moduleName + ' not found.',
        '\x1b[0m',
      );
      return;
    }

    response.write(config.rootPath);

    response.end();

    console.log(
      '\x1b[34m',
      'Synchronized with ' + moduleName + '...',
      '\x1b[0m',
    );
  };
}

module.exports = metroHandleSyncRequest;
