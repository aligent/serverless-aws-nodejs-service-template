import jsonParser from 'jsonc-eslint-parser';
import eslintBaseConfig from '../../eslint.config.mjs';

export default [
    ...eslintBaseConfig,
    {
        files: ['./package.json', './generators.json'],
        rules: { '@nx/nx-plugin-checks': 'error' },
        languageOptions: { parser: jsonParser },
    },
];
