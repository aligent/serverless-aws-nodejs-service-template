import { LambdaFunction, StepFunctionFromFile } from '@aligent/cdk-utils';
import { Duration } from 'aws-cdk-lib';
import { Runtime, Tracing } from 'aws-cdk-lib/aws-lambda';

export const APPLICATION_CONTEXT = {
    ...LambdaFunction.defineContext({
        timeout: Duration.seconds(6),
        memorySize: 192,
        runtime: Runtime.NODEJS_20_X,
        tracing: Tracing.ACTIVE,
        environment: {
            NODE_OPTIONS: '--enable-source-maps',
        },
        bundling: {
            sourceMap: true,
        },
        alias: 'LATEST',
    }),
    ...StepFunctionFromFile.defineContext({
        tracingEnabled: true,
        alias: 'LATEST',
    }),
    configFileName: 'random-number-config.json',
    clientName: 'aligent',
} as const;
