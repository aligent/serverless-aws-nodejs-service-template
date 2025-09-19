import { eslintConfigs } from '@aligent/ts-code-standards';
import jsonParser from 'jsonc-eslint-parser';
import nxEslintPlugin from '@nx/eslint-plugin';

const eslintBaseConfig = [
    ...eslintConfigs.base,
    {
        ignores: [
            '**/*.js',
            '**/*.cjs',
            '**/*.mjs',
            '**/coverage',
            '**/cdk.out',
            '**/dist',
            '**/out-tsc',
            '**/vite.config.*.timestamp*',
            '**/vitest.config.*.timestamp*',
        ],
    },
    {
        files: ['**/*.ts'],
        plugins: {
            '@nx': nxEslintPlugin,
        },
        rules: {
            '@nx/enforce-module-boundaries': [
                'error',
                {
                allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
                enforceBuildableLibDependency: true,
                depConstraints: [
                    {
                        sourceTag: 'scope:applications',
                        onlyDependOnLibsWithTags: ['scope:libs', 'scope:services'],
                    },
                    {
                        sourceTag: 'scope:services',
                        onlyDependOnLibsWithTags: ['scope:libs', 'scope:services'],
                    },
                    {
                        sourceTag: 'scope:libs',
                        onlyDependOnLibsWithTags: ['scope:libs'],
                    },
                ],
                },
            ],
        },
    },
    {
        files: ['**/*.json'],
        languageOptions: { parser: jsonParser },
    },
];

export default eslintBaseConfig;
