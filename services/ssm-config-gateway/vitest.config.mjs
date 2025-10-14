import { defineConfig, mergeConfig } from 'vitest/config';
import { viteBaseConfig } from '../../vitest.config.base.mjs';

export default defineConfig(configEnv => {
    return mergeConfig(
        viteBaseConfig(configEnv),
        defineConfig({
            cacheDir: '../../node_modules/.vite/ssm-config-gateway',
            test: {
                env: {
                    NODE_ENV: 'test',
                    YOUR_ENV_VAR: 'environment-variable',
                },
                unstubEnvs: true,
            },
        })
    );
});
