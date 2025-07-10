import { LambdaFunction, StepFunctionFromFile } from '@libs/cdk-utils/infra';
import { Duration } from 'aws-cdk-lib';
import { Runtime, Tracing } from 'aws-cdk-lib/aws-lambda';

/**
 * App-level context
 *
 * This is the primary mechanism for configuring the application.
 * It is used to define the build-time properties for the application.
 *
 * @see https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.Context.html
 */
export const APPLICATION_CONTEXT = {
    ...LambdaFunction.defineContext({
        timeout: Duration.seconds(6),
        memorySize: 192,
        runtime: Runtime.NODEJS_22_X,
        tracing: Tracing.ACTIVE,
        alias: 'LATEST',
    }),
    ...StepFunctionFromFile.defineContext({
        tracingEnabled: true,
        alias: 'LATEST',
    }),
} as const;
