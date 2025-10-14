import { Stack, StackProps, Stage, Tags } from 'aws-cdk-lib';
import { Code } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import path from 'node:path';
import { SERVICE_NAME } from './service-name';

export interface SsmConfigGatewayStackProps extends StackProps {
    description: string;
}

/**
 * Entrypoint for the ssm-config-gateway service
 *
 * Instantiate in a CDK Application Stage to deploy to AWS.
 *
 * Use 'resolve' helpers below when referencing lambda handlers, step function files etc.
 */
export class SsmConfigGatewayStack extends Stack {
    constructor(
        scope: Construct,
        id: typeof SERVICE_NAME | (string & {}),
        props?: SsmConfigGatewayStackProps
    ) {
        super(scope, id, props);

        const STAGE = Stage.of(this)?.stageName;
        if (!STAGE) {
            throw new Error('This construct must be used within a CDK Stage');
        }

        Tags.of(this).add('SERVICE', id);
    }
}

/**
 * Resolves a path to infra assets relative to this stack
 *
 * @param assetPath - The path to the asset.
 * @returns The resolved path.
 */
export function resolveAssetPath(assetPath: `${'infra/'}${string}`) {
    return path.resolve(import.meta.dirname, assetPath);
}

/**
 * Return an object with the default bundled code asset and
 * handler property for use with the NodejsFunction construct.
 *
 * @example
 * ```ts
 * new NodejsFunction(this, 'FetchData', {
 *     ...resolveLambdaHandler('runtime/handlers/fetch-data.ts'),
 * });
 * ```
 *
 * @param assetPath - The path to the typescript handler file.
 * @returns The resolved bundled code path and handler name.
 */
export function resolveLambdaHandler(assetPath: `${'runtime/handlers/'}${string}${'.ts'}`) {
    // Replace 'runtime/handlers/' with '..dist/' and remove the file extension
    const bundledPath = assetPath.replace(
        /^runtime\/handlers\/(?<path>.*)\.ts$/,
        '../dist/$<path>'
    );
    return {
        code: Code.fromAsset(path.resolve(import.meta.dirname, bundledPath)),
        handler: 'index.handler',
    };
}
