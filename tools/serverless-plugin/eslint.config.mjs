import { eslintBaseConfig } from '../../eslint.config.mjs';
import jsonEslintParser from 'jsonc-eslint-parser';

export default [
    ...eslintBaseConfig,
    {
        files: ['./package.json', './generators.json'],
        rules: { '@nx/nx-plugin-checks': 'error' },
        languageOptions: { parser: jsonEslintParser },
    },
];
