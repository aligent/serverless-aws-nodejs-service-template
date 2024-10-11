import { Tree, generateFiles, joinPathFragments } from '@nx/devkit';
import openapiTS, { astToString } from 'openapi-typescript';
import { ClientGeneratorSchema } from './schema.js';

export async function clientGenerator(
    tree: Tree,
    options: ClientGeneratorSchema
) {
    // TODO: Schema
    const { name, schemaPath } = options;

    // TODO: Check for valid URL in schema path, if valid get remote
    let contents;
    try {
        const url = new URL(schemaPath);
        if (url.protocol === 'http:' || url.protocol === 'https:') {
            console.log(`Fetching schema remotely from: ${url}...`);
            contents = await getRemoteSchema(schemaPath);
        } else {
            console.log(
                `Schema is not a valid remote URL, fetching locally...`
            );
            contents = await getLocalSchema(tree.root, schemaPath);
        }
    } catch {
        console.log(`Schema is not a valid remote URL, fetching locally...`);
        contents = await getLocalSchema(tree.root, schemaPath);
    }

    tree.write(`clients/${name}/types/index.d.ts`, contents);
    generateFiles(
        tree,
        joinPathFragments(__dirname, './files'),
        `/clients/${name}`,
        options
    );
}

// TODO: Add auth to this, so the request can be authenticated, will somehow need that to be inputted by the user, or grabbed from a config

/**
 * Gets the remote schema from an endpoint url. Uses configured authorization or passed in via the user
 * @param url Remote url to fetch the schema from
 * @returns a string representation of the remote schema
 */
async function getRemoteSchema(url: string) {
    const ast = await openapiTS(url);
    return astToString(ast);
}

/**
 * Grabs schema data from local directory. The schemaPath is evaluated relative to the root of the template project,
 * not the root of the generator.
 * @param rootDir Root directory of the project tree
 * @param schemaPath Path of the schema relative to the root of the entire project.
 * @returns a string representation of the schema contents.
 */
async function getLocalSchema(rootDir: string, schemaPath: string) {
    const ast = await openapiTS(
        new URL(`${rootDir}/${schemaPath}`, import.meta.url)
    );
    return astToString(ast);
}

export default clientGenerator;
