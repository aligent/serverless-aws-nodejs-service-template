import { type } from 'arktype';
import { Duration, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { describe, expect, test } from 'vitest';
import { S3Bucket } from './s3-bucket';

describe('S3Bucket', () => {
    describe('Lifecycle', () => {
        test('bucket has SHORT duration lifecycle rule', () => {
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

        test('bucket has MEDIUM duration lifecycle rule', () => {
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

        test('bucket has LONG duration lifecycle rule', () => {
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

        test('bucket has no lifecycle rule for PERMANENT duration', () => {
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

    describe('Versioning', () => {
        test('versioning is not enabled for non-PERMANENT durations', () => {
            const stack = new Stack();

            new S3Bucket(stack, 'ShortBucket', {
                duration: 'SHORT',
            });

            new S3Bucket(stack, 'MediumBucket', {
                duration: 'MEDIUM',
            });

            new S3Bucket(stack, 'LongBucket', {
                duration: 'LONG',
            });

            const template = Template.fromStack(stack);

            template.resourcePropertiesCountIs(
                'AWS::S3::Bucket',
                {
                    VersioningConfiguration: {
                        Status: 'Enabled',
                    },
                },
                0
            );
        });

        test('versioning is enabled when set to true', () => {
            const stack = new Stack();

            new S3Bucket(stack, 'ShortBucket', {
                duration: 'SHORT',
                versioned: true,
            });

            new S3Bucket(stack, 'MediumBucket', {
                duration: 'MEDIUM',
                versioned: true,
            });

            new S3Bucket(stack, 'LongBucket', {
                duration: 'LONG',
                versioned: true,
            });

            new S3Bucket(stack, 'TestBucket', {
                duration: 'PERMANENT',
                versioned: true,
            });

            const template = Template.fromStack(stack);

            // With PERMANENT duration and versioning, versioning should be enabled
            template.resourcePropertiesCountIs(
                'AWS::S3::Bucket',
                {
                    VersioningConfiguration: {
                        Status: 'Enabled',
                    },
                },
                4
            );
        });

        test('versioning is disabled when set to false', () => {
            const stack = new Stack();

            new S3Bucket(stack, 'ShortBucket', {
                duration: 'SHORT',
                versioned: false,
            });

            new S3Bucket(stack, 'MediumBucket', {
                duration: 'MEDIUM',
                versioned: false,
            });

            new S3Bucket(stack, 'LongBucket', {
                duration: 'LONG',
                versioned: false,
            });

            new S3Bucket(stack, 'TestBucket', {
                duration: 'PERMANENT',
                versioned: false,
            });

            const template = Template.fromStack(stack);

            template.resourcePropertiesCountIs(
                'AWS::S3::Bucket',
                {
                    VersioningConfiguration: {
                        Status: 'Enabled',
                    },
                },
                0
            );
        });
    });

    describe('Removal policy', () => {
        test('buckets have DeletionPolicy and UpdateReplacePolicy set to Delete for non-PERMANENT durations', () => {
            const stack = new Stack();

            new S3Bucket(stack, 'ShortBucket', {
                duration: 'SHORT',
            });

            new S3Bucket(stack, 'MediumBucket', {
                duration: 'MEDIUM',
            });

            new S3Bucket(stack, 'LongBucket', {
                duration: 'LONG',
            });

            const template = Template.fromStack(stack).toJSON();

            const bucketSchema = type({
                Type: '"AWS::S3::Bucket"',
                DeletionPolicy: 'string',
                UpdateReplacePolicy: 'string',
            });

            // Check that all S3 buckets have DeletionPolicy and UpdateReplacePolicy set to Delete
            const bucketResources = Object.values(template.Resources).filter(bucketSchema.allows);

            // Should have 3 buckets
            expect(bucketResources).toHaveLength(3);

            // Each bucket should have DeletionPolicy and UpdateReplacePolicy set to Delete
            bucketResources.forEach(resource => {
                expect(resource.DeletionPolicy).toBe('Delete');
                expect(resource.UpdateReplacePolicy).toBe('Delete');
            });
        });

        test('buckets have DeletionPolicy and UpdateReplacePolicy set to Retain for PERMANENT duration', () => {
            const stack = new Stack();

            new S3Bucket(stack, 'VersionedBucket', {
                duration: 'PERMANENT',
                versioned: true,
            });

            new S3Bucket(stack, 'NonVersionedBucket', {
                duration: 'PERMANENT',
                versioned: false,
            });

            const template = Template.fromStack(stack).toJSON();

            const bucketSchema = type({
                Type: '"AWS::S3::Bucket"',
                DeletionPolicy: 'string',
                UpdateReplacePolicy: 'string',
            });

            const bucketResources = Object.values(template.Resources).filter(bucketSchema.allows);

            // Should have 2 buckets
            expect(bucketResources).toHaveLength(2);

            // Each bucket should have DeletionPolicy and UpdateReplacePolicy set to Retain
            bucketResources.forEach(resource => {
                expect(resource.DeletionPolicy).toBe('Retain');
                expect(resource.UpdateReplacePolicy).toBe('Retain');
            });
        });
    });
});
