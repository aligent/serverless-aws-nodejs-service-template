import { type InjectionContext, type IPropertyInjector } from 'aws-cdk-lib';
import { Runtime, Tracing } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, type NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { logInjector } from './log-injector';

/**
 * Property injector for Node.js Lambda functions with configuration-aware defaults
 *
 * Applies configuration-specific bundling and runtime settings to Lambda functions.
 * Different configurations can optimize for different priorities such as build speed,
 * bundle size, or debugging capabilities.
 *
 * @example
 * ```typescript
 * // Apply configuration-specific defaults
 * PropertyInjectors.of(scope).add(
 *   new NodeJsFunctionDefaultsInjector({
 *     sourceMaps: true,
 *     esm: true,
 *     minify: true,
 *   }).withProps({
 *     timeout: Duration.seconds(30),
 *     memorySize: 256,
 *   })
 * );
 *
 * // Functions automatically inherit configuration defaults
 * new Function(stack, 'MyFunction', {
 *   code: Code.fromAsset('src/lambda'),
 *   handler: 'index.handler',
 *   // bundling and runtime config applied automatically
 * });
 * ```
 *
 * @see https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda_nodejs.NodejsFunction.html
 */
export class NodeJsFunctionDefaultsInjector implements IPropertyInjector {
    public readonly constructUniqueId = NodejsFunction.PROPERTY_INJECTION_ID;

    private defaultProps: NodejsFunctionProps;

    /**
     * Creates a new NodeJsFunctionDefaultsInjector
     *
     * @param configuration - Configuration identifier used to select appropriate defaults. Uses production defaults if not specified.
     * @param configuration.sourceMap - Whether to enable source maps.
     */
    constructor(
        private readonly configuration: {
            sourceMap: boolean;
        } = {
            sourceMap: true,
        }
    ) {
        this.defaultProps = {
            runtime: Runtime.NODEJS_22_X,
            tracing: Tracing.ACTIVE,
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
     * const customInjector = new NodeJsFunctionDefaultsInjector({
     *   sourceMaps: false,
     * })
     *   .withProps({
     *     timeout: Duration.minutes(5),
     *     memorySize: 1024,
     *   });
     * ```
     *
     * TODO: Provide a nice way to inherit global properties from previous injectors
     */
    public withProps(props: NodejsFunctionProps) {
        const modifiedInjector = new NodeJsFunctionDefaultsInjector(this.configuration);
        modifiedInjector.defaultProps = { ...this.defaultProps, ...props };
        return modifiedInjector;
    }

    /**
     * Injects configuration-appropriate defaults into Lambda function properties
     *
     * Merges configuration-specific defaults with user-provided properties,
     * automatically configuring bundling options and runtime settings.
     *
     * @param originalProps - Properties provided when creating the function
     * @param context - CDK injection context containing construct information
     * @returns Merged properties with injected defaults
     */
    public inject(originalProps: NodejsFunctionProps, context: InjectionContext) {
        logInjector(this.constructor.name, this.configuration, context);

        // The NodeJsFunction constructor pre-sets runtime to 16.x or LATEST depending on feature flags
        // We assume that using this injector means you want to standardise the runtime across all lambdas
        const runtime = this.defaultProps.runtime;

        const props = {
            ...this.defaultProps,
            ...originalProps,
            runtime,
        };

        // If source maps are enabled in our bundling, add the required NODE_OPTIONS flag to the environment
        const environment = {
            ...props.environment,
            ...(this.configuration.sourceMap ? { NODE_OPTIONS: '--enable-source-maps' } : {}),
        };

        return {
            ...props,
            environment,
        };
    }
}
