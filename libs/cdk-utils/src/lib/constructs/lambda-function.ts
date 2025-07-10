import { RemovalPolicy, Stage } from 'aws-cdk-lib';
import {
    LogLevel,
    NodejsFunction,
    OutputFormat,
    type NodejsFunctionProps,
} from 'aws-cdk-lib/aws-lambda-nodejs';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { propertyInjectable } from 'aws-cdk-lib/core/lib/prop-injectable';
import { Construct } from 'constructs';
import { DevelopmentApplicationStage, StagingApplicationStage } from './application-stage';

/**
 * LambdaFunctionProps
 *
 * @see https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda_nodejs.NodejsFunctionProps.html
 * for properties inherited from NodejsFunction
 */
export interface LambdaFunctionProps extends NodejsFunctionProps {
    /**
     * The entry point for the Lambda function.
     * This should be the fully resolved path to the handler file.
     *
     * @example path.join(__dirname, 'cdk/handlers/remap-eta.ts')
     */
    readonly entry: string;
    /**
     * Alias for the Lambda function.
     * If undefined, the function will not be versioned or aliased.
     *
     * @example 'LATEST'
     */
    readonly alias?: string;
}

/**
 * Narrowed type helper for setting global defaults
 *
 * Exclusions:
 * logGroup, entry point - doesn't make sense to set on a global level
 * logRetention - legacy API
 *
 * @see https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda_nodejs.NodejsFunctionProps.html
 * for properties inherited from NodejsFunction
 */
type LambdaFunctionContext = Omit<LambdaFunctionProps, 'entry' | 'logGroup' | 'logRetention'>;

/**
 * LambdaFunction construct
 *
 * Set application-level defaults using the context api
 *
 * @example
 * ```ts
 * const APPLICATION_CONTEXT = {
 *     ...LambdaFunction.defineContext({
 *         runtime: Runtime.NODEJS_20_X,
 *     }),
 * };
 * ```
 *
 * @see https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda_nodejs.NodejsFunctionProps.html
 * for properties inherited from NodejsFunction
 */
@propertyInjectable
export class LambdaFunction extends NodejsFunction {
    readonly PROPERTY_INJECTION_ID = '@aligent.cdk-utils.LambdaFunction';
    static readonly CONTEXT_KEY = '@aligent.cdk-utils.LambdaFunction';

    /**
     * Define context properties for the LambdaFunction construct
     *
     * @param props - The properties for the LambdaFunction construct
     * @returns The context for the LambdaFunction construct
     *
     * @see https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda_nodejs.NodejsFunctionProps.html
     * for properties inherited from NodejsFunction
     */
    static defineContext(props: LambdaFunctionContext) {
        return {
            [this.CONTEXT_KEY]: props,
        };
    }

    constructor(scope: Construct, id: string, props: LambdaFunctionProps) {
        // Get base defaults from context
        const defaults: LambdaFunctionContext =
            scope.node.tryGetContext(LambdaFunction.CONTEXT_KEY) || {};

        // Get the current stage
        const currentStage = Stage.of(scope);
        if (!currentStage) {
            throw new Error('This construct must be used within a CDK Stage');
        }

        // Create a log group for the function with stage-appropriate properties if one hasn't been provided
        const logGroup =
            props.logGroup ||
            new LogGroup(scope, `/aws/lambda/${id}`, logGroupProperties(currentStage));

        // Apply stage-specific bundling optimizations
        const bundling = {
            ...bundlingProperties(currentStage),
            ...defaults.bundling,
            ...props.bundling,
        };

        const environment = {
            ...defaults.environment,
            ...props.environment,
            // Always enable source maps in the environment if they've been set for bundling
            ...(bundling.sourceMap ? { NODE_OPTIONS: '--enable-source-maps' } : {}),
        };

        // Merge all configurations with stage-optimized bundling taking precedence
        // TODO may need to do a proper deep merge here
        const finalProps = {
            ...defaults,
            ...props,
            environment,
            bundling,
            logGroup,
        };

        super(scope, id, finalProps);

        if (props.alias) {
            this.addAlias(props.alias);
        }
    }
}

/**
 * Get stage-specific log group properties
 *
 * Development and staging log groups don't need to last forever
 * and should be cleaned up along with their stack when removed
 *
 * @param stage - The stage to get the log group properties for
 * @returns The log group properties for the stage
 */
function logGroupProperties(stage: Stage) {
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
        case stage instanceof DevelopmentApplicationStage:
            return devConfig;
        case stage instanceof StagingApplicationStage:
            return stagingConfig;
        default:
            return productionConfig;
    }
}

/**
 * Get stage-specific bundling configuration
 *
 * Production stages use optimized settings for performance
 * Development stages use development-friendly settings
 *
 * @param stage - The stage to get the bundling properties for
 * @returns The bundling properties for the stage
 */
function bundlingProperties(stage: Stage) {
    // Dev configuration optimised for debugging, analysis, and bundling speed
    const devConfig = {
        logLevel: LogLevel.INFO,
        minify: false,
        sourceMap: false,
        metafile: true, // Required for bundle analysis
        format: OutputFormat.ESM,
    } satisfies NodejsFunctionProps['bundling'];

    // Staging/Production configurations optimised for bundle size
    const stagingConfig = {
        keepNames: true,
        logLevel: LogLevel.INFO,
        minify: true,
        sourceMap: true,
        buildArgs: {
            bundle: 'true',
            treeShaking: 'true',
        },
        format: OutputFormat.ESM,
    } satisfies NodejsFunctionProps['bundling'];

    const productionConfig = {
        keepNames: true,
        // TODO is this necessary? It might only apply to ESBuild logs
        logLevel: LogLevel.INFO,
        minify: true,
        // TODO: Source maps are really large, consider disabling for production
        sourceMap: true,
        buildArgs: {
            bundle: 'true',
            treeShaking: 'true',
        },
        format: OutputFormat.ESM,
    } satisfies NodejsFunctionProps['bundling'];

    switch (true) {
        case stage instanceof DevelopmentApplicationStage:
            return devConfig;
        case stage instanceof StagingApplicationStage:
            return stagingConfig;
        default:
            return productionConfig;
    }
}
