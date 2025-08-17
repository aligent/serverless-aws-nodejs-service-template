import { defineConfig, mergeConfig } from 'vitest/config';
import { viteBaseConfig } from '../../vite.config.base.mjs';

export default mergeConfig(
    viteBaseConfig,
    defineConfig({
        cacheDir: '../../node_modules/.vite/cdk-utils',
        test: {
            environment: {
                NODE_ENV: 'test',
            },
        },
    })
);
