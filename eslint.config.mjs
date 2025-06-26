import { eslintConfigs } from '@aligent/ts-code-standards';
import eslintPluginImport from 'eslint-plugin-import';
import jsonParser from 'jsonc-eslint-parser';
import nxEslintPlugin from '@nx/eslint-plugin';

const eslintBaseConfig = [
    ...eslintConfigs.base,
    {
        ignores: ['**/*.js', '**/*.cjs', '**/*.mjs', '**/coverage', '**/cdk.out'],
    },
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

export default eslintBaseConfig;
