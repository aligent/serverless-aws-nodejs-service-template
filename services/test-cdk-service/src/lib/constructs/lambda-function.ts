import { Duration } from 'aws-cdk-lib';
import { IFunction, Runtime, Tracing } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

export interface LambdaFunctionProps {
    readonly entry: string;
}

export class LambdaFunction extends Construct {
    public readonly function: IFunction;

    constructor(scope: Construct, id: string, props: LambdaFunctionProps) {
        super(scope, id);

        const { entry } = props;

        const nodeJsFunction = new NodejsFunction(this, 'Function', {
            // @ts-expect-error - stackName is not a property of Construct
            functionName: `${scope.stackName}-${id}`,
            entry,
            // TODO: Make this configurable
            timeout: Duration.seconds(6),
            memorySize: 192,
            // TODO: Make this reference a global attribute across the whole app and default to LTS if not found
            runtime: Runtime.NODEJS_20_X,
            tracing: Tracing.ACTIVE,
            environment: {
                NODE_OPTIONS: '--enable-source-maps',
            },
            bundling: {
                sourceMap: true,
            },
        });

        this.function = nodeJsFunction.addAlias('LATEST');
    }
}
