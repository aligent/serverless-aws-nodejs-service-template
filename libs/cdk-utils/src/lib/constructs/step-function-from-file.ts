import type { Function } from 'aws-cdk-lib/aws-lambda';
import {
    CfnStateMachineAlias,
    CfnStateMachineVersion,
    DefinitionBody,
    StateMachine,
    type StateMachineProps,
} from 'aws-cdk-lib/aws-stepfunctions';
import { propertyInjectable } from 'aws-cdk-lib/core/lib/prop-injectable';
import { Construct } from 'constructs';

export interface StepFunctionFromFileProps extends StateMachineProps {
    readonly filepath: string;
    readonly alias?: string;
    readonly lambdaFunctions?: Function[];
}

/**
 * Narrowed type helper for setting global defaults
 *
 * Exclusions:
 * filepath, definitionSubstitutions, lambdaFunctions - doesn't make sense to set on a global level
 */
type StepFunctionFromFileContext = Omit<
    StepFunctionFromFileProps,
    'filepath' | 'definitionSubstitutions' | 'lambdaFunctions'
>;

/**
 * Merge in definition substitutions supporting the format `Resource: ${lambdaId}`
 * in YAML syntax
 *
 * @param definitionSubstitutions - The definition substitutions to merge in.
 * @param lambdaFunctions - The lambda functions to merge in.
 * @returns The merged definition substitutions in an object that can be spread in to StepFunctionProps
 */
function prepareDefinitionSubstitutionsObject(
    definitionSubstitutions: Record<string, string> | undefined,
    lambdaFunctions: Function[] | undefined
) {
    if (!lambdaFunctions?.length) {
        return definitionSubstitutions ? { definitionSubstitutions } : {};
    }

    const lambdaDefinitions = Object.fromEntries(
        lambdaFunctions.map(fn => [fn.node.id, fn.functionArn])
    );

    return { definitionSubstitutions: { ...definitionSubstitutions, ...lambdaDefinitions } };
}

@propertyInjectable
export class StepFunctionFromFile extends StateMachine {
    readonly PROPERTY_INJECTION_ID = '@aligent.cdk-utils.StepFunctionFromFile';
    static readonly CONTEXT_KEY = '@aligent.cdk-utils.StepFunctionFromFile';

    static defineContext(props: StepFunctionFromFileContext) {
        return {
            [this.CONTEXT_KEY]: props,
        };
    }

    /**
     * Get the context for the StepFunctionFromFile construct.
     *
     * @param scope - The scope to get the context from.
     * @returns The context for the StepFunctionFromFile construct.
     */
    static getContext(scope: Construct): StepFunctionFromFileContext {
        return scope.node.tryGetContext(StepFunctionFromFile.CONTEXT_KEY) || {};
    }

    constructor(scope: Construct, id: string, props: StepFunctionFromFileProps) {
        const defaults = StepFunctionFromFile.getContext(scope);

        const definitionSubstitutionsObject = prepareDefinitionSubstitutionsObject(
            props.definitionSubstitutions,
            props.lambdaFunctions
        );

        const { filepath, alias, ...newProps } = {
            ...defaults,
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

        if (alias) {
            const version = new CfnStateMachineVersion(this, `Version`, {
                stateMachineArn: this.stateMachineArn,
            });

            new CfnStateMachineAlias(this, `Alias`, {
                name: alias,
                routingConfiguration: [
                    {
                        stateMachineVersionArn: version.attrArn,
                        weight: 100,
                    },
                ],
            });
        }
    }
}
