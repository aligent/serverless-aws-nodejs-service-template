import { Duration } from 'aws-cdk-lib';
import { Bucket, type BucketProps } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

/**
 * Properties for the TemporaryDataBucket construct
 */
export type S3BucketProps = BucketProps &
    (
        | {
              duration: 'SHORT' | 'MEDIUM' | 'LONG';
          }
        | {
              duration: 'PERMANENT';
              versioned: boolean;
          }
    );

/**
 * S3 bucket construct for configuration files with versioning
 *
 * This construct creates an S3 bucket with the following defaults:
 * - Versioning enabled if `versioned` is true
 * - Lifecycle rules for short, medium, and long-lived data
 *
 * @example
 * ```typescript
 * // Create a bucket with short-lived data
 * new S3Bucket(this, 'ConfigFiles', {
 *     duration: 'SHORT',
 * });
 *
 * // Create a bucket with long-lived data and versioning
 * new S3Bucket(this, 'ConfigFiles', {
 *     duration: 'LONG',
 *     versioned: true,
 * });
 * ```
 */
export class S3Bucket extends Bucket {
    /**
     * Creates a new S3Bucket construct
     *
     * @param scope - The parent construct
     * @param id - The construct ID
     * @param props - Optional bucket properties that override or extend the defaults
     */
    constructor(scope: Construct, id: string, props: S3BucketProps) {
        const defaultProps = {
            versioned: props?.versioned ?? false,
            lifecycleRules: formatLifecycleRules(props?.duration),
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

function formatLifecycleRules(duration: S3BucketProps['duration'], versioned = false) {
    if (duration === 'PERMANENT') {
        return versioned
            ? [
                  {
                      id: 'VersionedData',
                      enabled: true,
                      noncurrentVersionsToRetain: 5,
                      noncurrentVersionExpiration: Duration.days(7),
                  },
              ]
            : [];
    }

    switch (duration) {
        case 'SHORT':
            return [
                {
                    id: 'ShortLivedData',
                    enabled: true,
                    expiration: Duration.days(7),
                },
            ];
        case 'MEDIUM':
            return [
                {
                    id: 'MediumLivedData',
                    enabled: true,
                    expiration: Duration.days(30),
                },
            ];
        default:
            return [
                {
                    id: 'LongLivedData',
                    enabled: true,
                    expiration: Duration.days(365),
                },
            ];
    }
}
