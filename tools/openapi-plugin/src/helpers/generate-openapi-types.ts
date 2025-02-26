// @ts-expect-error This is ignored because openapi-typescript has issues with CJS support. https://arethetypeswrong.github.io/?p=openapi-typescript%407.5.2
import openapiTS, { astToString } from 'openapi-typescript';

import { Tree } from '@nx/devkit';
import { loadConfig } from '@redocly/openapi-core';
import { spawn } from 'child_process';

/**
 * Generates the open api types using openapi-typescript,
 * @returns Generated type contents
 */
export async function generateOpenApiTypes(
    tree: Tree,
    schemaPath: string,
    remote = false,
    configPath?: string
) {
    // Parse schema into type definition
    let contents;
    if (remote) {
        console.log('Getting remote schema...');
        contents = await getRemoteSchema(schemaPath, configPath);
    } else {
        console.log(
            'Getting local schema... (use --remote to get remote schema)'
        );
        contents = await getLocalSchema(tree.root, schemaPath);
    }

    return contents;
}

/**
 * Gets the remote schema from an endpoint url. Uses configured authorization or passed in via the user
 * @param url Remote url to fetch the schema from
 * @param configPath The path to a local 'redocly' config file. This will be passed into the requests, mainly to specify auth details if required.
 * @returns a string representation of the remote schema
 */
async function getRemoteSchema(url: string, configPath?: string) {
    const parsed = new URL(url);

    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        throw new Error(`${parsed} is an invalid remote url.`);
    }

    if (configPath) {
        const config = await loadConfig({ configPath });
        console.log('Loaded Config: ', config);
        console.log('Generating types...');
        const ast = await openapiTS(new URL(url), {
            redocly: config,
        });
        return astToString(ast);
    } else {
        const ast = await openapiTS(new URL(url));
        return astToString(ast);
    }
}

/**
 * Grabs schema data from local directory. The schemaPath is evaluated relative to the root of the template project,
 * not the root of the generator.
 * @param rootDir Root directory of the project tree
 * @param schemaPath Path of the schema relative to the root of the entire project.
 * @returns a string representation of the schema contents.
 */
async function getLocalSchema(rootDir: string, schemaPath: string) {
    try {
        console.log('Generating types...');
        const ast = await openapiTS(`file:///${rootDir}/${schemaPath}`);
        return astToString(ast);
    } catch (e) {
        throw new Error(
            `Failed to generate local file at path ${rootDir}/${schemaPath} (did you mean to pass --remote?)` +
                e
        );
    }
}

/**
 * Copies the original schema from the source to newly generated client
 */
export async function copySchema(
    tree: Tree,
    name: string,
    schemaPath: string,
    remote?: boolean
) {
    let schemaBuffer;
    if (remote) {
        const response = await fetch(schemaPath);
        schemaBuffer = Buffer.from(await response.arrayBuffer());
    } else {
        schemaBuffer = tree.read(schemaPath);
    }
    if (schemaBuffer) {
        tree.write(
            `clients/${name}/schema` + schemaPath.slice(-5), // Use last 5 characters to determine file type
            schemaBuffer
        );
    }
}

export async function validateSchema(schemaPath: string) {
    return new Promise((resolve, reject) => {
        const child = spawn('npx', ['@redocly/cli', 'lint', schemaPath], {
            stdio: ['pipe', 'inherit', 'inherit'],
        });

        child.on('close', (code) => {
            if (code === 0) {
                resolve(`Validation completed`);
            } else {
                reject(new Error(`Validation failed with code ${code}`));
            }
        });
    });
}
