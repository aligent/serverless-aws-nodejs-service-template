import {
    Tree,
    addProjectConfiguration,
    formatFiles,
    generateFiles,
    joinPathFragments,
} from '@nx/devkit';
import openapiTS, { astToString } from 'openapi-typescript';
import { loadConfig } from '@redocly/openapi-core';
import { ClientGeneratorSchema } from './schema';

export async function clientGenerator(
    tree: Tree,
    options: ClientGeneratorSchema
) {
    const { name, schemaPath, remote, configPath } = options;
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
    tree.write(`${projectRoot}/types/index.d.ts`, contents);

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

    // Complete generation
    await generateFiles(
        tree,
        joinPathFragments(__dirname, './files'),
        projectRoot,
        options
    );
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
        const ast = await openapiTS(new URL(url), { redocly: config });
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

export default clientGenerator;
