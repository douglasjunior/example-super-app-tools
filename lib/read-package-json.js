const fs = require('fs');
const path = require('path');

const modulePath = process.cwd();
const packageJsonPath = path.resolve(modulePath, 'package.json');

if (!fs.existsSync(packageJsonPath)) {
  throw new Error(
    'Certifique-se de executar este comando na raiz do projeto.',
  );
}

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, { encoding: 'utf-8' }))

module.exports = packageJson;
