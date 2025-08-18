import { RemovalPolicy, type InjectionContext, type IPropertyInjector } from 'aws-cdk-lib';
import { LogGroup, RetentionDays, type LogGroupProps } from 'aws-cdk-lib/aws-logs';
import { logInjector } from './log-injector';

/**
 * Property injector for CloudWatch Log Groups with configuration-aware defaults
 *
 * Applies configuration-specific retention policies and removal settings to log groups.
 * Different configurations balance between cost optimization and data retention needs.
 *
 * Configuration-specific defaults:
 * - 'dev': Short retention (1 week), destroyed with stack
 * - 'stg': Medium retention (6 months), destroyed with stack
 * - Default: Long retention (2 years), retained when stack is deleted
 *
 * @example
 * ```typescript
 * // Apply configuration-specific defaults
 * PropertyInjectors.of(scope).add(
 *   new LogGroupDefaultsInjector({ duration: 'SHORT' }).withProps({
 *     logGroupName: '/custom/log/group',
 *   })
 * );
 *
 * // Log groups automatically inherit configuration defaults
 * new LogGroup(stack, 'MyLogGroup', {
 *   // retention and removal policy applied automatically
 * });
 * ```
 *
 * @see https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_logs.LogGroup.html
 */
export class LogGroupDefaultsInjector implements IPropertyInjector {
    readonly constructUniqueId = LogGroup.PROPERTY_INJECTION_ID;
    private defaultProps: LogGroupProps;

    /**
     * Creates a new LogGroupDefaultsInjector
     *
     * @param configuration - Configuration identifier used to select appropriate defaults.
     */
    constructor(
        private readonly configuration: {
            duration: 'SHORT' | 'MEDIUM' | 'LONG';
        } = {
            duration: 'LONG',
        }
    ) {
        this.defaultProps = {
            ...retentionProperties(configuration.duration),
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
     * const customInjector = new LogGroupDefaultsInjector({ duration: 'SHORT' })
     *   .withProps({
     *     logGroupName: '/aws/lambda/custom',
     *     retention: RetentionDays.ONE_MONTH,
     *   });
     * ```
     */
    public withProps(props: LogGroupProps) {
        const modifiedInjector = new LogGroupDefaultsInjector(this.configuration);
        modifiedInjector.defaultProps = { ...this.defaultProps, ...props };
        return modifiedInjector;
    }

    /**
     * Injects configuration-appropriate defaults into log group properties
     *
     * Merges configuration-specific retention and removal policies with user-provided properties.
     *
     * @param originalProps - Properties provided when creating the log group
     * @param context - CDK injection context containing construct information
     * @returns Merged properties with injected defaults
     */
    public inject(originalProps: LogGroupProps, context: InjectionContext) {
        logInjector(this.constructor.name, this.configuration, context);
        return {
            ...this.defaultProps,
            ...originalProps,
        };
    }
}

/**
 * Get duration-specific log group properties
 *
 * @param duration - The duration to get the log group properties for
 * @returns The log group properties for the duration
 */
function retentionProperties(duration: 'SHORT' | 'MEDIUM' | 'LONG') {
    switch (true) {
        case duration === 'SHORT':
            return {
                retention: RetentionDays.ONE_WEEK,
                removalPolicy: RemovalPolicy.DESTROY,
            };
        case duration === 'MEDIUM':
            return {
                retention: RetentionDays.SIX_MONTHS,
                removalPolicy: RemovalPolicy.DESTROY,
            };
        default:
            return {
                retention: RetentionDays.TWO_YEARS,
                removalPolicy: RemovalPolicy.RETAIN,
            };
    }
}
