import { eslintConfigs } from '@aligent/ts-code-standards';
import eslintPluginImport from 'eslint-plugin-import';
import jsonParser from 'jsonc-eslint-parser';
import nxEslintPlugin from '@nx/eslint-plugin';

export const eslintBaseConfig = [
    ...eslintConfigs.core,
    {
        files: ['**/*.ts'],
        plugins: {
            '@nx': nxEslintPlugin,
            import: eslintPluginImport,
        },
        rules: {
            '@nx/enforce-module-boundaries': [
                'error',
                {
                    enforceBuildableLibDependency: true,
                    allow: [],
                    depConstraints: [
                        {
                            sourceTag: '*',
                            onlyDependOnLibsWithTags: ['*'],
                        },
                    ],
                },
            ],
            'import/no-extraneous-dependencies': [
                'warn',
                {
                    optionalDependencies: false,
                    peerDependencies: false,
                    bundledDependencies: false,
                    packageDir: ['.', '../..'],
                },
            ],
        },
    },
    {
        files: ['**/*.json'],
        languageOptions: { parser: jsonParser },
    },
];
