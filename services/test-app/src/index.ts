import { Stack, StackProps, Stage, Tags } from 'aws-cdk-lib';
import { Code } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import path from 'node:path';
import { SERVICE_NAME } from './service-name';

export interface TestAppStackProps extends StackProps {
    description: string;
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
 * Resolves a path to runtime assets relative to this stack
 *
 * @param assetPath - The path to the asset.
 * @returns The resolved bundled code path.
 */
export function resolveRuntimeAssetPath(assetPath: `${'runtime/'}${string}${'.ts'}`) {
    const bundledPath = assetPath.replace(path.extname(assetPath), '');
    return Code.fromAsset(path.resolve(import.meta.dirname, 'dist', bundledPath, 'index.mjs'));
}

export class TestAppStack extends Stack {
    constructor(
        scope: Construct,
        id: typeof SERVICE_NAME | (string & {}),
        props?: TestAppStackProps
    ) {
        super(scope, id, props);

        const STAGE = Stage.of(this)?.stageName;
        if (!STAGE) {
            throw new Error('This construct must be used within a CDK Stage');
        }

        Tags.of(this).add('SERVICE', id);

        const fetchPokemon = new NodejsFunction(this, 'FetchPokemon', {
            code: resolveRuntimeAssetPath('runtime/handlers/fetch-pokemon.ts'),
        });

        const transformPokemon = new NodejsFunction(this, 'TransformPokemon', {
            code: resolveRuntimeAssetPath('runtime/handlers/transform-pokemon.ts'),
        });

        console.log(fetchPokemon.functionArn, transformPokemon.functionArn);
    }
}
