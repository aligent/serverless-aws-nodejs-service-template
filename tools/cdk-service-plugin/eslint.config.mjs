import eslintBaseConfig from '../../eslint.config.mjs';
import jsonParser from 'jsonc-eslint-parser';
import nxEslintPlugin from '@nx/eslint-plugin';

export default [
    ...eslintBaseConfig,
    {
        plugins: {
            '@nx': nxEslintPlugin,
        },
        files: ['./package.json', './generators.json'],
        rules: { '@nx/nx-plugin-checks': 'error' },
        languageOptions: { parser: jsonParser },
    },
];
