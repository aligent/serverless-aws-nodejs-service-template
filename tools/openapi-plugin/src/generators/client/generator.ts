import { Tree, generateFiles, joinPathFragments } from '@nx/devkit';
import openapiTS, { astToString } from 'openapi-typescript';
import { ClientGeneratorSchema } from './schema.js';

export async function clientGenerator(
    tree: Tree,
    options: ClientGeneratorSchema
) {
    const { name, schemaPath } = options;
    const rootDir = tree.root;
    const ast = await openapiTS(
        new URL(`${rootDir}/${schemaPath}`, import.meta.url)
    );
    const contents = astToString(ast);

    tree.write(`clients/${name}/types/index.d.ts`, contents);
    generateFiles(
        tree,
        joinPathFragments(__dirname, './files'),
        `/clients/${name}`,
        options
    );
}

export default clientGenerator;
