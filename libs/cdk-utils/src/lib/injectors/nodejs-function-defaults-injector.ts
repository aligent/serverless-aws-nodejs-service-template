import { type InjectionContext, type IPropertyInjector } from 'aws-cdk-lib';
import { Runtime, Tracing } from 'aws-cdk-lib/aws-lambda';
import {
    NodejsFunction,
    OutputFormat,
    type NodejsFunctionProps,
} from 'aws-cdk-lib/aws-lambda-nodejs';
import { logInjector } from './log-injector';

/**
 * ESM support banner
 *
 * This is a workaround to support ESM in Lambda functions.
 * Aliases are used to avoid name conflicts, this may not be a real issue
 *
 * @see https://github.com/evanw/esbuild/issues/1944
 * @see https://aws.plainenglish.io/significantly-improve-typescript-lambda-function-readability-in-aws-console-613bc5ae98f6
 */
const ESM_SUPPORT_BANNER = [
    `import { fileURLToPath } from 'url';`,
    `import { createRequire as topLevelCreateRequire } from 'module';`,
    `import { dirname as ddirname } from 'path';`,
    `const require = topLevelCreateRequire(import.meta.url);`,
    `const __filename = fileURLToPath(import.meta.url);`,
    `const __dirname = ddirname(__filename);`,
].join(''); // Must be a single line, if the banner has `\n` characters they cause a syntax error

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
     * @param configuration.esm - Whether to enable ESM support.
     * @param configuration.minify - Whether to enable minification.
     */
    constructor(
        private readonly configuration: {
            sourceMap: boolean;
            esm: boolean;
            minify: boolean;
        } = {
            sourceMap: true,
            esm: true,
            minify: true,
        }
    ) {
        this.defaultProps = {
            runtime: Runtime.NODEJS_22_X,
            bundling: bundlingProperties(configuration),
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
     *   esm: false,
     *   minify: false,
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
            ...(props.bundling?.sourceMap ? { NODE_OPTIONS: '--enable-source-maps' } : {}),
        };

        return {
            ...props,
            environment,
        };
    }
}

/**
 * Returns configuration-specific bundling properties for Lambda functions
 *
 * Provides optimized bundling configurations for different environments:
 * - 'dev': Fast builds for development (no minification, bundle analysis enabled)
 * - 'stg': Balanced configuration for staging
 * - Default: Production-optimized (minified, tree-shaking enabled)
 *
 * @param configuration - Configuration identifier to determine bundling strategy
 * @returns Bundling properties optimized for the specified configuration
 */
function bundlingProperties({
    sourceMap,
    esm,
    minify,
}: {
    sourceMap: boolean;
    esm: boolean;
    minify: boolean;
}) {
    return {
        ...(sourceMap && { sourceMap: true }),
        ...(esm && { format: OutputFormat.ESM, banner: ESM_SUPPORT_BANNER }),
        ...(minify && {
            keepNames: true,
            minify: true,
            buildArgs: {
                bundle: 'true',
                treeShaking: 'true',
            },
        }),
    };
}
