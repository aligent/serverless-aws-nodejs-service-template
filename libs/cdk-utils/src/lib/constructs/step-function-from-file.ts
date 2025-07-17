import { Stage } from 'aws-cdk-lib';
import type { Function } from 'aws-cdk-lib/aws-lambda';
import { LogGroup } from 'aws-cdk-lib/aws-logs';
import {
    CfnStateMachineAlias,
    CfnStateMachineVersion,
    DefinitionBody,
    LogLevel,
    StateMachine,
    StateMachineType,
    type StateMachineProps,
} from 'aws-cdk-lib/aws-stepfunctions';
import { propertyInjectable } from 'aws-cdk-lib/core/lib/prop-injectable';
import { Construct } from 'constructs';
import { logGroupProperties } from './log-group-properties';

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

/**
 * Prepare the logging configuration for the step function.
 *
 * @param scope - The scope to create the log group in.
 * @param props - The properties for the step function.
 * @returns The logging configuration for an express step function, empty object otherwise.
 */
function prepareLoggingConfiguration(
    scope: Construct,
    id: string,
    stage: Stage,
    props: StepFunctionFromFileProps
) {
    if (props.stateMachineType !== StateMachineType.EXPRESS) {
        return {};
    }

    const logGroup = props.logs?.destination ?? new LogGroup(scope, id, logGroupProperties(stage));

    return {
        logs: {
            destination: logGroup,
            level: LogLevel.ALL,
            includeExecutionData: true,
            ...props.logs,
        },
    };
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

        // Get the current stage
        const currentStage = Stage.of(scope);
        if (!currentStage) {
            throw new Error('This construct must be used within a CDK Stage');
        }

        // Add logging configuration for EXPRESS step functions
        const loggingConfigurationObject = prepareLoggingConfiguration(
            scope,
            `/aws/states/${id}`,
            currentStage,
            props
        );

        // Add lambda functions to definition substitutions if they have been provided
        const definitionSubstitutionsObject = prepareDefinitionSubstitutionsObject(props);

        const { filepath, alias, ...newProps } = {
            ...defaults,
            ...props,
            ...definitionSubstitutionsObject,
            ...loggingConfigurationObject,
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
