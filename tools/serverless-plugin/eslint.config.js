const eslintBaseConfig = require('../../eslint.config.js');
const jsonParser = require('jsonc-eslint-parser');

module.exports = [
    ...eslintBaseConfig,
    {
        files: ['./package.json', './generators.json'],
        rules: { '@nx/nx-plugin-checks': 'error' },
        languageOptions: { parser: jsonParser },
    },
];
