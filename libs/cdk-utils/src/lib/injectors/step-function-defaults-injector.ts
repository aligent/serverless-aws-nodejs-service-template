import type { InjectionContext, IPropertyInjector } from 'aws-cdk-lib';
import { LogGroup } from 'aws-cdk-lib/aws-logs';
import {
    LogLevel,
    StateMachine,
    StateMachineType,
    type StateMachineProps,
} from 'aws-cdk-lib/aws-stepfunctions';
import type { Construct } from 'constructs';

type StepFunctionDefaults = Omit<StateMachineProps, 'definition' | 'definitionSubstitutions'>;

export class StepFunctionDefaultsInjector implements IPropertyInjector {
    public readonly constructUniqueId = StateMachine.PROPERTY_INJECTION_ID;

    private defaultProps: StateMachineProps;

    constructor(private readonly configuration: string = 'prd') {
        this.defaultProps = {
            tracingEnabled: true,
        };
    }

    public addProps(props: StateMachineProps) {
        this.defaultProps = {
            ...this.defaultProps,
            ...props,
        };
        return this;
    }

    public inject(originalProps: StateMachineProps, context: InjectionContext) {
        console.log(
            `${StepFunctionDefaultsInjector.name}: Injecting ${this.configuration} defaults for ${context.id}`
        );

        console.log(this.defaultProps);
        console.log(originalProps);

        // Prepare logging configuration for EXPRESS step functions
        const logging =
            originalProps.stateMachineType === StateMachineType.EXPRESS
                ? expressLogProperties(context.scope, context.id, originalProps)
                : {};

        return {
            ...this.defaultProps,
            ...originalProps,
            ...logging,
        };
    }
}

/**
 * Build the logging configuration for an express step function, respecting
 * existing logging configuration.
 *
 * @param machineScope - The scope of the step function.
 * @param machineId - The id of the step function.
 * @param props - The properties for the step function.
 * @returns The logging configuration for an express step function
 */
function expressLogProperties(
    machineScope: Construct,
    machineId: string,
    props: StepFunctionDefaults
) {
    // Create a new log group if one is not provided
    const logGroup =
        props.logs?.destination ?? new LogGroup(machineScope, `/aws/states/${machineId}`);

    return {
        logs: {
            destination: logGroup,
            level: LogLevel.ALL,
            includeExecutionData: true,
            ...props.logs,
        },
    };
}
