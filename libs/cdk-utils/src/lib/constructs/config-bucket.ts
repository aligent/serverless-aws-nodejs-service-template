import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import { Bucket, type BucketProps } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

/**
 * Properties for the TemporaryDataBucket construct
 */
export type ConfigBucketProps = BucketProps;

/**
 * S3 bucket construct for configuration files with versioning
 *
 * This construct creates an S3 bucket with the following defaults:
 * - Versioning enabled
 * - Auto-delete objects when the bucket is removed
 * - Destroy bucket on stack deletion
 * - Retain 5 noncurrent versions
 * - Expire noncurrent versions after 30 days
 *
 * These defaults can be overridden via props if needed.
 */
export class ConfigBucket extends Bucket {
    constructor(scope: Construct, id: string, props?: ConfigBucketProps) {
        const defaultProps = {
            versioned: true,
            autoDeleteObjects: true,
            removalPolicy: RemovalPolicy.DESTROY,
            lifecycleRules: [
                {
                    id: 'ConfigurationFiles',
                    enabled: true,
                    // Keep the 5 most recent versions indefinitely
                    noncurrentVersionsToRetain: 5,
                    // Delete versions beyond the 5 most recent after 7 days
                    noncurrentVersionExpiration: Duration.days(7),
                },
            ],
        } satisfies BucketProps;

        // Merge defaults with user-provided props
        const finalProps = {
            ...defaultProps,
            ...props,
            // If user provides lifecycle rules, merge them with defaults
            // Apply user provided rules first, then defaults
            lifecycleRules: [...(props?.lifecycleRules || []), ...defaultProps.lifecycleRules],
        };

        super(scope, id, finalProps);
    }
}
