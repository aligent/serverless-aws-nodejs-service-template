const { eslintConfigs } = require('@aligent/ts-code-standards');
const eslintPluginImport = require('eslint-plugin-import');
const jsonParser = require('jsonc-eslint-parser');
const nxEslintPlugin = require('@nx/eslint-plugin');

const eslintBaseConfig = [
    ...eslintConfigs.core,
    {
        ignores: ['**/*.js', '**/*.mjs', '**/coverage'],
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

module.exports = eslintBaseConfig;
