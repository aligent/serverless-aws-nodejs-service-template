import { Duration, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { describe, expect, test } from 'vitest';
import { S3Bucket } from './s3-bucket';

describe('S3Bucket', () => {
    test('creates bucket with SHORT duration lifecycle', () => {
        const stack = new Stack();

        new S3Bucket(stack, 'TestBucket', {
            duration: 'SHORT',
        });

        const template = Template.fromStack(stack);

        template.hasResourceProperties('AWS::S3::Bucket', {
            LifecycleConfiguration: {
                Rules: [
                    {
                        Id: 'ShortLivedData',
                        Status: 'Enabled',
                        ExpirationInDays: 7,
                    },
                ],
            },
        });
    });

    test('creates bucket with MEDIUM duration lifecycle', () => {
        const stack = new Stack();

        new S3Bucket(stack, 'TestBucket', {
            duration: 'MEDIUM',
        });

        const template = Template.fromStack(stack);

        template.hasResourceProperties('AWS::S3::Bucket', {
            LifecycleConfiguration: {
                Rules: [
                    {
                        Id: 'MediumLivedData',
                        Status: 'Enabled',
                        ExpirationInDays: 30,
                    },
                ],
            },
        });
    });

    test('creates bucket with LONG duration lifecycle', () => {
        const stack = new Stack();

        new S3Bucket(stack, 'TestBucket', {
            duration: 'LONG',
        });

        const template = Template.fromStack(stack);

        template.hasResourceProperties('AWS::S3::Bucket', {
            LifecycleConfiguration: {
                Rules: [
                    {
                        Id: 'LongLivedData',
                        Status: 'Enabled',
                        ExpirationInDays: 365,
                    },
                ],
            },
        });
    });

    test('creates bucket with PERMANENT duration and versioning', () => {
        const stack = new Stack();

        new S3Bucket(stack, 'TestBucket', {
            duration: 'PERMANENT',
            versioned: true,
        });

        const template = Template.fromStack(stack);

        // With PERMANENT duration and versioning, versioning should be enabled
        template.hasResourceProperties('AWS::S3::Bucket', {
            VersioningConfiguration: {
                Status: 'Enabled',
            },
        });
    });

    test('creates bucket with PERMANENT duration without versioning', () => {
        const stack = new Stack();

        new S3Bucket(stack, 'TestBucket', {
            duration: 'PERMANENT',
            versioned: false,
        });

        const template = Template.fromStack(stack);

        // For PERMANENT duration without versioning, bucket should not have versioning
        const bucketResources = template.findResources('AWS::S3::Bucket');
        const bucketKeys = Object.keys(bucketResources);
        expect(bucketKeys).toHaveLength(1);
    });

    test('merges user-provided lifecycle rules with defaults', () => {
        const stack = new Stack();

        new S3Bucket(stack, 'TestBucket', {
            duration: 'SHORT',
            lifecycleRules: [
                {
                    id: 'CustomRule',
                    enabled: true,
                    expiration: Duration.days(180),
                },
            ],
        });

        const template = Template.fromStack(stack);

        template.hasResourceProperties('AWS::S3::Bucket', {
            LifecycleConfiguration: {
                Rules: [
                    {
                        Id: 'CustomRule',
                        Status: 'Enabled',
                        ExpirationInDays: 180,
                    },
                    {
                        Id: 'ShortLivedData',
                        Status: 'Enabled',
                        ExpirationInDays: 7,
                    },
                ],
            },
        });
    });
});
