import { builtinModules } from 'node:module';
import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

// More information about mode: https://vite.dev/guide/env-and-mode.html#node-env-and-modes
export const viteBaseConfig = defineConfig(({ mode }) => {
    return {
        build: {
            sourcemap: mode !== 'production',
            minify: mode !== 'development',
            emptyOutDir: true,
            reportCompressedSize: true,
            ssr: true,
            target: 'esnext',
            rollupOptions: {
                external: [...builtinModules],
                output: {
                    entryFileNames: '[name]/index.mjs',
                    format: 'es',
                    inlineDynamicImports: true,
                },
            },
        },
        // FIXME: test and find a way around this
        // ssr: { target: 'node', noExternal: true },
        ssr: { target: 'node' },
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
                resolve(import.meta.dirname, './vite.global.setup.mjs'),
            ],
        },
    };
});
