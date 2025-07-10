import { App, Duration, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { describe, it } from 'vitest';
import { TemporaryDataBucket } from './temporary-data-bucket';

describe('TemporaryDataBucket', () => {
    it('should create a bucket with default properties', () => {
        const app = new App();
        const stack = new Stack(app, 'TestStack');

        new TemporaryDataBucket(stack, 'TestBucket');

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

        template.hasResource('Custom::S3AutoDeleteObjects', {
            Properties: {
                ServiceToken: {
                    'Fn::GetAtt': [
                        Match.stringLikeRegexp('S3AutoDeleteObjectsCustomResource.*'),
                        'Arn',
                    ],
                },
            },
        });

        template.hasResource('AWS::S3::Bucket', {
            DeletionPolicy: 'Delete',
            UpdateReplacePolicy: 'Delete',
        });
    });

    it('should allow overriding default properties', () => {
        const app = new App();
        const stack = new Stack(app, 'TestStack');

        new TemporaryDataBucket(stack, 'TestBucket', {
            autoDeleteObjects: false,
            removalPolicy: RemovalPolicy.RETAIN,
            lifecycleRules: [],
        });

        const template = Template.fromStack(stack);

        template.hasResource('AWS::S3::Bucket', {
            DeletionPolicy: 'Retain',
            UpdateReplacePolicy: 'Retain',
        });

        // Auto delete objects custom resource should not exist
        template.resourceCountIs('Custom::S3AutoDeleteObjects', 0);

        // Should still have default lifecycle rule
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

    it('should maintain type compatibility with BucketProps', () => {
        const app = new App();
        const stack = new Stack(app, 'TestStack');

        new TemporaryDataBucket(stack, 'TestBucket', {
            bucketName: 'my-temp-bucket',
            versioned: true,
            enforceSSL: true,
        });

        const template = Template.fromStack(stack);

        template.hasResourceProperties('AWS::S3::Bucket', {
            BucketName: 'my-temp-bucket',
            VersioningConfiguration: {
                Status: 'Enabled',
            },
        });
    });

    it('should allow custom expiration duration in lifecycle rules', () => {
        const app = new App();
        const stack = new Stack(app, 'TestStack');

        new TemporaryDataBucket(stack, 'TestBucket', {
            lifecycleRules: [
                {
                    id: 'CustomExpiration',
                    enabled: true,
                    expiration: Duration.hours(48),
                    prefix: 'custom-prefix/',
                },
            ],
        });

        const template = Template.fromStack(stack);

        template.hasResourceProperties('AWS::S3::Bucket', {
            LifecycleConfiguration: {
                Rules: [
                    {
                        Id: 'CustomExpiration',
                        Status: 'Enabled',
                        ExpirationInDays: 2,
                        Prefix: 'custom-prefix/',
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
