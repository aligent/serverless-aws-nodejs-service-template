/**
 * A current bug exists in the TS generator package that doesn't correctly replace "integer" types specified in OpenAPI specs with "number"
 * which is what typescript understands. This fixes that by replacing all instances of the issue.
 *
 * {@link https://github.com/openapi-ts/openapi-typescript/issues/1930}
 */
export function convertIntegerTypes(contents: string) {
    const newContents = contents?.replaceAll('${integer}', '${number}');
    return newContents;
}
