import { NodejsFunction, type NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { propertyInjectable } from 'aws-cdk-lib/core/lib/prop-injectable';
import { Construct } from 'constructs';

export interface LambdaFunctionProps extends NodejsFunctionProps {
    readonly entry: string;
    readonly alias?: string;
}

@propertyInjectable
export class LambdaFunction extends NodejsFunction {
    readonly PROPERTY_INJECTION_ID = '@aligent.cdk-utils.LambdaFunction';
    static readonly CONTEXT_KEY = '@aligent.cdk-utils.LambdaFunction';

    static defineContext(props: Omit<LambdaFunctionProps, 'entry'>) {
        return {
            [this.CONTEXT_KEY]: props,
        };
    }

    constructor(scope: Construct, id: string, props: LambdaFunctionProps) {
        const defaults = scope.node.tryGetContext(LambdaFunction.CONTEXT_KEY) || {};
        super(scope, id, { ...defaults, ...props });

        if (props.alias) {
            this.addAlias(props.alias);
        }
    }
}
