import type { Function } from 'aws-cdk-lib/aws-lambda';
import {
    DefinitionBody,
    StateMachine,
    type StateMachineProps,
} from 'aws-cdk-lib/aws-stepfunctions';
import { propertyInjectable } from 'aws-cdk-lib/core/lib/prop-injectable';
import { Construct } from 'constructs';

export interface StepFunctionFromFileProps extends StateMachineProps {
    readonly filepath: string;
    readonly lambdaFunctions?: Function[];
}

/**
 * Merge in definition substitutions supporting the format `Resource: ${lambdaId}`
 * in YAML syntax
 *
 * @param definitionSubstitutions - The definition substitutions to merge in.
 * @param lambdaFunctions - The lambda functions to merge in.
 * @returns Merged definitions if lambda functions provided, empty object otherwise
 */
function prepareDefinitionSubstitutionsObject(props: StepFunctionFromFileProps) {
    const { definitionSubstitutions, lambdaFunctions } = props;

    if (!lambdaFunctions?.length) {
        return {};
    }

    const lambdaDefinitions = Object.fromEntries(
        lambdaFunctions.map(fn => [fn.node.id, fn.functionArn])
    );

    return { definitionSubstitutions: { ...definitionSubstitutions, ...lambdaDefinitions } };
}

@propertyInjectable
export class StepFunctionFromFile extends StateMachine {
    constructor(scope: Construct, id: string, props: StepFunctionFromFileProps) {
        // Add lambda functions to definition substitutions if they have been provided
        const definitionSubstitutionsObject = prepareDefinitionSubstitutionsObject(props);

        const { filepath, ...newProps } = {
            ...props,
            ...definitionSubstitutionsObject,
        };

        super(scope, id, {
            definitionBody: DefinitionBody.fromFile(props.filepath),
            ...newProps,
        });

        // If lambda functions are provided, give the state machine
        // permission to invoke them
        // TODO Is there a more efficient way to do this?
        if (props.lambdaFunctions) {
            props.lambdaFunctions.forEach(fn => {
                fn.grantInvoke(this);
            });
        }
    }
}
