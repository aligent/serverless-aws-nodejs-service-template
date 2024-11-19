import { defineConfig, mergeConfig } from 'vitest/config';
import { viteBaseConfig } from '../../vite.config.base.mjs';

export default mergeConfig(
    viteBaseConfig,
    defineConfig({
        cacheDir: '../../node_modules/.vite/<%= name %>',
        test: {
            env: {
                NODE_ENV: 'test',
                YOUR_ENV_VAR: 'environment-variable',
            },
            unstubEnvs: true,
        },
    })
);
