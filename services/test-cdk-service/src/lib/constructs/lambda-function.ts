import { Duration, Stack } from 'aws-cdk-lib';
import { Runtime, Tracing } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, type NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';

export interface LambdaFunctionProps extends NodejsFunctionProps {
    readonly entry: string;
}

export class LambdaFunction extends NodejsFunction {
    constructor(scope: Stack, id: string, props: LambdaFunctionProps) {
        super(scope, id, {
            functionName: `${scope.stackName}-${id}`,
            timeout: Duration.seconds(6),
            memorySize: 192,
            // TODO: Make this reference a global attribute across the whole app and default to LTS if not found
            runtime: Runtime.NODEJS_20_X,
            tracing: Tracing.ACTIVE,
            // TODO: This may need to be merged more carefully
            environment: {
                NODE_OPTIONS: '--enable-source-maps',
            },
            bundling: {
                sourceMap: true,
            },
            ...props,
        });

        this.addAlias('LATEST');
    }
}
