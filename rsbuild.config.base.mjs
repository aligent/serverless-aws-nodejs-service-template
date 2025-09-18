import { defineConfig } from '@rsbuild/core';
import fg from 'fast-glob';
import { extname, resolve } from 'node:path';

const HANDLERS_PATH = 'src/runtime/handlers';

/**
 * Prepare Rsbuild config that bundles all typescript files in a single directory in to separate files
 * This is used to bundle lambda handlers with their own dependencies for separate upload to AWS Lambda
 *
 * @param {string} configPath Full path to the rsbuild.config.mjs file this is used in - usually import.meta.dirname;
 * @param {string} subPath Relative path to the handlers directory. Default is 'src/runtime/handlers'
 * @returns Rsbuild config for multiple lambda handlers
 */
export function defineLambdaConfig(configPath, subPath = HANDLERS_PATH) {
    const basePath = resolve(configPath, subPath);
    const handlers = fg.sync(`${basePath}/**/*.ts`);

    // Format an entry object containing each file found in the folder
    // Maintains subfolder structure
    // e.g. { 'test/log-object': 'test/log-object' }
    const entry = Object.fromEntries(
        handlers.map(handler => {
            const bundledPath = handler.replace(`${basePath}/`, '');
            const entryName = bundledPath.replace(extname(bundledPath), '');
            return [entryName, handler];
        })
    );

    return defineConfig({
        source: {
            entry,
            tsconfigPath: './tsconfig.lib.json',
        },
        performance: {
            chunkSplit: {
                // Not sure this is necessary for single-file-bundling but seems safer to set it
                strategy: 'all-in-one',
            },
        },
        output: {
            // Only bundle javascript/typescript code
            target: 'node',
            // Output ESM modules
            module: true,
            filename: { js: '[name]/index.mjs' },
            // Don't output license comments in bundled code
            legalComments: 'none',
        },
        tools: {
            rspack: {
                output: {
                    // Forces bundler to include all dependencies in one file
                    asyncChunks: false,
                },
                optimization: {
                    // Prevent bundler from wrapping handlers in an IIFE
                    avoidEntryIife: true
                }
            },
        }
    });
}
