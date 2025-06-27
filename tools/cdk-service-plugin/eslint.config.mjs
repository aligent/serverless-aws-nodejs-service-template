import eslintBaseConfig from '../../eslint.config.mjs';
import jsonParser from 'jsonc-eslint-parser';

export default [
    ...eslintBaseConfig,
    {
        files: ['./package.json', './generators.json'],
        rules: { '@nx/nx-plugin-checks': 'error' },
        languageOptions: { parser: jsonParser },
    },
];
