/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

export const viteBaseConfig = defineConfig({
    plugins: [nxViteTsPaths()],
    test: {
        globals: true,
        watch: false,
        environment: 'node',
        reporters: ['default'],
        coverage: {
            provider: 'v8',
            exclude: ['node_modules/', '**/types', '*.mjs'],
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
    },
});
