import { defineConfig, mergeConfig } from 'vitest/config';
import { viteBaseConfig } from '../../vite.config.base.mjs';

export default mergeConfig(
    viteBaseConfig,
    defineConfig({
        cacheDir: '../../node_modules/.vite/cdk-utils',
        test: {
            coverage: {
                thresholds: {
                    branches: 80,
                    functions: 40,
                    lines: 40,
                    statements: 40,
                },
            }
        }
    })
);