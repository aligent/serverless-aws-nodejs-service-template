/// <reference types="vitest" />
import { defineConfig } from 'vite';

const viteConfigs = defineConfig({
    test: {
        globals: true,
        coverage: {
            provider: 'istanbul',
            reporter: ['text', 'html'],
            exclude: ['node_modules/'],
            all: true,
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80,
        },
    },
});

module.exports = viteConfigs;
