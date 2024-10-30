import { defineConfig, mergeConfig } from 'vitest/config';
import { viteBaseConfig } from '../../vite.config.mjs';

export default mergeConfig(
    viteBaseConfig,
    defineConfig({
        cacheDir: '../../node_modules/.vite/serverless-plugin',
    })
);
