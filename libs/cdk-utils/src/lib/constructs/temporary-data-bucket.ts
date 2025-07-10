import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import { Bucket, type BucketProps } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

/**
 * Properties for the TemporaryDataBucket construct
 */
export type TemporaryDataBucketProps = BucketProps;

/**
 * S3 bucket construct for temporary data with automatic cleanup
 *
 * This construct creates an S3 bucket with the following defaults:
 * - Auto-delete objects when the bucket is removed
 * - Destroy bucket on stack deletion
 * - Expire objects after 7 days
 *
 * These defaults can be overridden via props if needed.
 */
export class TemporaryDataBucket extends Bucket {
    constructor(scope: Construct, id: string, props?: TemporaryDataBucketProps) {
        const defaultProps = {
            autoDeleteObjects: true,
            removalPolicy: RemovalPolicy.DESTROY,
            lifecycleRules: [
                {
                    id: 'ShortLivedData',
                    enabled: true,
                    expiration: Duration.days(7),
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
