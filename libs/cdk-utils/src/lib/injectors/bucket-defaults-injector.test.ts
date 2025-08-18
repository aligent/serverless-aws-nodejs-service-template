import { PropertyInjectors, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { Bucket, BucketEncryption } from 'aws-cdk-lib/aws-s3';
import { beforeEach, describe, expect, it } from 'vitest';
import { BucketDefaultsInjector } from './bucket-defaults-injector';

describe('BucketDefaultsInjector', () => {
    let stack: Stack;

    beforeEach(() => {
        stack = new Stack();
        PropertyInjectors.of(stack).add(new BucketDefaultsInjector());
    });

    it('should inject auto-delete and destroy defaults', () => {
        new Bucket(stack, 'TestBucket');

        const template = Template.fromStack(stack);

        template.hasResourceProperties('Custom::S3AutoDeleteObjects', {});

        template.hasResource('AWS::S3::Bucket', {
            DeletionPolicy: 'Delete',
            UpdateReplacePolicy: 'Delete',
        });
    });

    it('should set autoDelete to false when explicitly configured', () => {
        const injector = new BucketDefaultsInjector({ autoDelete: false }).withProps({
            versioned: true,
            encryption: BucketEncryption.S3_MANAGED,
        });
        PropertyInjectors.of(stack).add(injector);

        new Bucket(stack, 'TestBucket');

        const template = Template.fromStack(stack);

        template.hasResource('AWS::S3::Bucket', {
            DeletionPolicy: 'Retain',
            UpdateReplacePolicy: 'Retain',
        });

        template.resourceCountIs('Custom::S3AutoDeleteObjects', 0);
    });

    it('should allow overriding defaults with explicit properties', () => {
        new Bucket(stack, 'TestBucket', {
            removalPolicy: RemovalPolicy.RETAIN,
            autoDeleteObjects: false,
        });

        const template = Template.fromStack(stack);

        expect(() => {
            template.hasResourceProperties('Custom::S3AutoDeleteObjects', {});
        }).toThrow();

        template.hasResource('AWS::S3::Bucket', {
            DeletionPolicy: 'Retain',
            UpdateReplacePolicy: 'Retain',
        });
    });

    it('should work with withProps to add additional defaults', () => {
        const injector = new BucketDefaultsInjector().withProps({
            versioned: true,
            encryption: BucketEncryption.S3_MANAGED,
        });
        PropertyInjectors.of(stack).add(injector);

        new Bucket(stack, 'TestBucket');

        const template = Template.fromStack(stack);

        template.hasResourceProperties('AWS::S3::Bucket', {
            VersioningConfiguration: {
                Status: 'Enabled',
            },
            BucketEncryption: {
                ServerSideEncryptionConfiguration: [
                    {
                        ServerSideEncryptionByDefault: {
                            SSEAlgorithm: 'AES256',
                        },
                    },
                ],
            },
        });

        template.hasResourceProperties('Custom::S3AutoDeleteObjects', {});
    });

    it('should apply defaults to multiple buckets', () => {
        new Bucket(stack, 'Bucket1');
        new Bucket(stack, 'Bucket2');
        new Bucket(stack, 'Bucket3');

        const template = Template.fromStack(stack);

        const resources = template.findResources('AWS::S3::Bucket');
        expect(Object.keys(resources)).toHaveLength(3);

        Object.values(resources).forEach(resource => {
            expect(resource.DeletionPolicy).toBe('Delete');
            expect(resource.UpdateReplacePolicy).toBe('Delete');
        });
    });
});
