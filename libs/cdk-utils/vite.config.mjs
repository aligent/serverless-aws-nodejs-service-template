import { defineConfig, mergeConfig } from 'vitest/config';
import { viteBaseConfig } from '../../vite.config.base.mjs';

export default defineConfig(configEnv =>
    mergeConfig(
        viteBaseConfig(configEnv),
        defineConfig({
            cacheDir: '../../node_modules/.vite/cdk-utils',
            test: {
                env: {
                    NODE_ENV: 'test',
                },
            },
        })
    )
);
