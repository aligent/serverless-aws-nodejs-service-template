import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export const viteBaseConfig = defineConfig({
    plugins: [nxViteTsPaths()],
    test: {
        globals: true,
        watch: false,
        environment: 'node',
        reporters: ['default'],
        coverage: {
            provider: 'v8',
            exclude: [
                'node_modules/',
                '**/types',
                '*.mjs',
                '**/__data__',
                '**/dist',
                '**/out-tsc',
            ],
            thresholds: {
                branches: 80,
                functions: 80,
                lines: 80,
                statements: 80,
            },
        },
        include: [
            'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
            'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
        ],
        setupFiles: [
            // Include the root setup file in all tests that extend this config
            path.resolve(import.meta.dirname, './vite.global.setup.mjs'),
        ],
    },
});