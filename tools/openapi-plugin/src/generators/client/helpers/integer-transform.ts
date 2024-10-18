import { Tree } from '@nx/devkit';

export function convertIntegerTypes(projectRoot: string, tree: Tree) {
    const filePath = `${projectRoot}/types/index.d.ts`;

    const indexContents = tree.read(filePath)?.toString();
    if (!indexContents) throw new Error('Could not find index.d.ts file');

    // A current bug exists in the TS generator package that doesn't correctly replace "integer" types specified in OpenAPI specs with "number"
    // which is what typescript understands. This fixes that by replacing all instances of the issue.
    // https://github.com/openapi-ts/openapi-typescript/issues/1930
    const newContents = indexContents?.replaceAll('${integer}', '${number}');
    tree.write(filePath, newContents);
}
