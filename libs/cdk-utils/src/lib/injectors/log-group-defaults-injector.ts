import { RemovalPolicy, type InjectionContext, type IPropertyInjector } from 'aws-cdk-lib';
import { LogGroup, RetentionDays, type LogGroupProps } from 'aws-cdk-lib/aws-logs';

/**
 * Injector for cloudwatch log group properties based on stage id
 *
 * Defaults to production settings but can be overridden using the `addProps` method
 *
 * @see https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_logs.LogGroup.html
 */
export class LogGroupDefaultsInjector implements IPropertyInjector {
    public readonly constructUniqueId = LogGroup.PROPERTY_INJECTION_ID;
    private defaultProps: LogGroupProps;

    constructor(private readonly configuration: string = 'prd') {
        this.defaultProps = retentionProperties(configuration);
    }

    public addProps(props: LogGroupProps) {
        this.defaultProps = {
            ...this.defaultProps,
            ...props,
        };
    }

    public inject(originalProps: LogGroupProps, context: InjectionContext) {
        console.log(
            `${LogGroupDefaultsInjector.name}: Injecting ${this.configuration} defaults for ${context.id}`
        );

        return {
            ...this.defaultProps,
            ...originalProps,
        };
    }
}

/**
 * Get stage-specific log group properties
 *
 * Development and staging log groups don't need to last forever
 * and should be cleaned up along with their stack when removed
 *
 *
 * @param stage - The stage to get the log group properties for
 * @returns The log group properties for the stage
 */
function retentionProperties(stage: string) {
    const devConfig = {
        retention: RetentionDays.ONE_WEEK,
        removalPolicy: RemovalPolicy.DESTROY,
    };

    const stagingConfig = {
        retention: RetentionDays.SIX_MONTHS,
        removalPolicy: RemovalPolicy.DESTROY,
    };

    const productionConfig = {
        retention: RetentionDays.TWO_YEARS,
        removalPolicy: RemovalPolicy.RETAIN,
    };

    switch (true) {
        case stage === 'dev':
            return devConfig;
        case stage === 'stg':
            return stagingConfig;
        default:
            return productionConfig;
    }
}
