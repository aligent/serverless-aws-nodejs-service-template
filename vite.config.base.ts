/// <reference types="vitest" />
import { defineConfig } from 'vite';
import viteTsConfigPaths from 'vite-tsconfig-paths';

export const viteBaseConfig = defineConfig({
    plugins: [
        viteTsConfigPaths({
            root: '../../',
        }),
    ],

    // Uncomment this if you are using workers.
    // worker: {
    //  plugins: [
    //    viteTsConfigPaths({
    //      root: '../../',
    //    }),
    //  ],
    // },

    test: {
        globals: true,
        environment: 'node',
        coverage: {
            reporter: ['text', 'html'],
            exclude: ['node_modules/'],
            all: true,
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80,
        },
        cache: {
            dir: '../../node_modules/.vitest',
        },
        include: [
            'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
            'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
        ],
    },
});
