import { type InjectionContext, type IPropertyInjector } from 'aws-cdk-lib';
import { LogGroup } from 'aws-cdk-lib/aws-logs';
import {
    LogLevel,
    StateMachine,
    StateMachineType,
    type StateMachineProps,
} from 'aws-cdk-lib/aws-stepfunctions';
import type { Construct } from 'constructs';
import { logInjector } from './log-injector';

type StepFunctionDefaults = Omit<StateMachineProps, 'definition' | 'definitionSubstitutions'>;

/**
 * Property injector for Step Functions with configuration-aware defaults
 *
 * Applies configuration-specific settings to Step Functions. All configurations enable
 * X-Ray tracing by default for observability. For EXPRESS state machines, automatically
 * creates log groups and configures comprehensive logging.
 *
 * @example
 * ```typescript
 * // Apply configuration-specific defaults
 * PropertyInjectors.of(scope).add(
 *   new StepFunctionDefaultsInjector('dev').withProps({
 *     timeout: Duration.minutes(30),
 *   })
 * );
 *
 * // Step Functions automatically inherit defaults
 * new StateMachine(stack, 'MyWorkflow', {
 *   stateMachineType: StateMachineType.EXPRESS,
 *   definitionBody: DefinitionBody.fromFile('workflow.asl.yaml'),
 *   // tracing enabled and logging configured automatically for EXPRESS
 * });
 * ```
 *
 * @see https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_stepfunctions.StateMachine.html
 */
export class StepFunctionDefaultsInjector implements IPropertyInjector {
    public readonly constructUniqueId = StateMachine.PROPERTY_INJECTION_ID;

    private defaultProps: StateMachineProps;

    /**
     * Creates a new StepFunctionDefaultsInjector
     *
     * @param configuration - Configuration identifier (currently unused but maintained for consistency).
     *                       All configurations enable tracing by default.
     */
    constructor(private readonly configuration?: Record<string, never>) {
        this.defaultProps = {
            tracingEnabled: true,
        };
    }

    /**
     * Creates a new injector instance with additional properties
     *
     * Returns a new injector that inherits the current configuration but includes
     * additional properties that override the configuration defaults.
     *
     * @param props - Additional properties to merge with configuration defaults
     * @returns A new injector instance with merged properties
     *
     * @example
     * ```typescript
     * const customInjector = new StepFunctionDefaultsInjector('prod')
     *   .withProps({
     *     timeout: Duration.hours(1),
     *     stateMachineName: 'custom-workflow',
     *   });
     * ```
     */
    public withProps(props: StateMachineProps) {
        const modifiedInjector = new StepFunctionDefaultsInjector(this.configuration);
        modifiedInjector.defaultProps = { ...this.defaultProps, ...props };
        return modifiedInjector;
    }

    /**
     * Injects configuration-appropriate defaults into Step Function properties
     *
     * Enables X-Ray tracing for all state machines. For EXPRESS state machines,
     * automatically creates log groups and configures comprehensive logging.
     *
     * @param originalProps - Properties provided when creating the state machine
     * @param context - CDK injection context containing construct information
     * @returns Merged properties with injected defaults and logging configuration
     */
    public inject(originalProps: StateMachineProps, context: InjectionContext) {
        logInjector(this.constructor.name, this.configuration, context);

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
