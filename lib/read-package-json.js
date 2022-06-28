const fs = require('fs');
const path = require('path');

const config = require('./config');

const packageJsonPath = path.resolve(config.rootPath, 'package.json');

if (!fs.existsSync(packageJsonPath)) {
  throw new Error(
    'Certifique-se de executar este comando na raiz do projeto.',
  );
}

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, { encoding: 'utf-8' }))

module.exports = packageJson;
