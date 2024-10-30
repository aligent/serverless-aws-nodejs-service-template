import {
    Tree,
    addProjectConfiguration,
    formatFiles,
    generateFiles,
    joinPathFragments,
    updateJson,
} from '@nx/devkit';
import openapiTS, { astToString } from 'openapi-typescript';
import { loadConfig } from '@redocly/openapi-core';
import { ClientGeneratorSchema } from './schema';
import { convertIntegerTypes } from './helpers/integer-transform';
import { spawn } from 'child_process';

export async function clientGenerator(
    tree: Tree,
    options: ClientGeneratorSchema
) {
    const {
        name,
        schemaPath,
        remote,
        configPath,
        importPath = `@clients/${name}`,
    } = options;

    const projectRoot = `clients/${name}`;

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

    await validate(schemaPath);
    await copySchema(tree, name, schemaPath, remote);

    addProjectConfiguration(tree, name, {
        root: projectRoot,
        projectType: 'library',
        sourceRoot: `${projectRoot}/src`,
        targets: {
            // TODO: (MI-94) Add a target here to regenerate a client again. That build target should call openapi-typescript again and overwrite type files
        },
        tags: ['client', name],
    });

    contents = convertIntegerTypes(contents);

    tree.write(`${projectRoot}/types/index.d.ts`, contents);

    // Complete generation
    await generateFiles(
        tree,
        joinPathFragments(__dirname, './files'),
        `/clients/${name}`,
        options
    );

    // Add the project to the tsconfig paths so it can be imported by namespace
    addTsConfigPath(tree, importPath, [
        joinPathFragments(projectRoot, './src', 'index.ts'),
    ]);

    await formatFiles(tree);
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
        const ast = await openapiTS(`file:///${rootDir}/${schemaPath}`);
        return astToString(ast);
    } catch (e) {
        throw new Error(
            `Failed to generate local file at path ${rootDir}/${schemaPath} (did you mean to pass --remote?)` +
                e
        );
    }
}

async function copySchema(
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

async function validate(schemaPath: string) {
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

/**
 * These utility functions are only exported by '@nx/js', not '@nx/devkit'
 * They're simple so we recreate them here instead of adding '@nx/js' as a dependency
 * Source: {@link https://github.com/nrwl/nx/blob/master/packages/js/src/utils/typescript/ts-config.ts}
 */
export function getRootTsConfigPathInTree(tree: Tree): string {
    for (const path of ['tsconfig.base.json', 'tsconfig.json']) {
        if (tree.exists(path)) {
            return path;
        }
    }

    return 'tsconfig.base.json';
}

function addTsConfigPath(
    tree: Tree,
    importPath: string,
    lookupPaths: string[]
) {
    updateJson(tree, getRootTsConfigPathInTree(tree), (json) => {
        json.compilerOptions ??= {};
        const c = json.compilerOptions;
        c.paths ??= {};

        if (c.paths[importPath]) {
            throw new Error(
                `You already have a library using the import path "${importPath}". Make sure to specify a unique one.`
            );
        }

        c.paths[importPath] = lookupPaths;

        return json;
    });
}

export default clientGenerator;
