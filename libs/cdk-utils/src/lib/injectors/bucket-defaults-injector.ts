import { RemovalPolicy, type InjectionContext, type IPropertyInjector } from 'aws-cdk-lib';
import { Bucket, type BucketProps } from 'aws-cdk-lib/aws-s3';
import { logInjector } from './log-injector';

/**
 * Property injector for S3 Buckets with configuration-aware defaults
 *
 * Applies sensible defaults to S3 buckets to ensure clean stack deletion
 * and prevent orphaned resources. By default, buckets are configured to:
 * - Auto-delete all objects when the bucket is removed
 * - Destroy the bucket when the stack is deleted
 *
 * These defaults can be overridden by explicitly providing different values
 * in the bucket properties.
 *
 * Configuration-specific behavior:
 * - All configurations: Apply auto-delete and destroy policies by default
 * - Production configurations may want to override with RETAIN for critical data
 *
 * @example
 * ```typescript
 * // Apply bucket defaults globally
 * PropertyInjectors.of(scope).add(
 *   new BucketDefaultsInjector()
 * );
 *
 * // Buckets automatically get cleanup defaults
 * new Bucket(stack, 'MyBucket', {
 *   // autoDeleteObjects: true (injected)
 *   // removalPolicy: DESTROY (injected)
 * });
 *
 * // Override defaults for critical data
 * new Bucket(stack, 'CriticalData', {
 *   removalPolicy: RemovalPolicy.RETAIN, // Overrides injected default
 *   autoDeleteObjects: false, // Overrides injected default
 * });
 * ```
 *
 * @see https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_s3.Bucket.html
 */
export class BucketDefaultsInjector implements IPropertyInjector {
    public readonly constructUniqueId = Bucket.PROPERTY_INJECTION_ID;
    private defaultProps: BucketProps;

    /**
     * Creates a new BucketDefaultsInjector
     *
     * @param configuration - Configuration identifier used for logging.
     * @param configuration.autoDelete - Whether to auto-delete objects when the bucket is removed.
     */
    constructor(
        private readonly configuration: {
            autoDelete: boolean;
        } = {
            autoDelete: true,
        }
    ) {
        this.defaultProps = {
            autoDeleteObjects: configuration.autoDelete,
            removalPolicy: configuration.autoDelete ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN,
        };
    }

    /**
     * Creates a new injector instance with additional properties
     *
     * Returns a new injector that inherits the current configuration but includes
     * additional properties that override the default cleanup behavior.
     *
     * @param props - Additional properties to merge with defaults
     * @returns A new injector instance with merged properties
     *
     * @example
     * ```typescript
     * const customInjector = new BucketDefaultsInjector({
     *   autoDelete: false,
     * })
     *   .withProps({
     *     versioned: true,
     *     encryption: BucketEncryption.S3_MANAGED,
     *   });
     * ```
     */
    public withProps(props: BucketProps) {
        const modifiedInjector = new BucketDefaultsInjector(this.configuration);
        modifiedInjector.defaultProps = { ...this.defaultProps, ...props };
        return modifiedInjector;
    }

    /**
     * Injects default cleanup properties into bucket configuration
     *
     * Merges default auto-delete and removal policies with user-provided properties.
     * User-provided properties take precedence over injected defaults.
     *
     * @param originalProps - Properties provided when creating the bucket
     * @param context - CDK injection context containing construct information
     * @returns Merged properties with injected defaults
     */
    public inject(originalProps: BucketProps, context: InjectionContext) {
        logInjector(this.constructor.name, this.configuration, context);
        // User-provided properties take precedence over defaults
        return {
            ...this.defaultProps,
            ...originalProps,
        };
    }
}
