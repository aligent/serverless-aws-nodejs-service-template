import { LambdaFunction, MicroserviceChecks, StepFunctionFromFile } from '@aligent/cdk-utils';
import { App, Aspects, Duration, Stack } from 'aws-cdk-lib';
import { Annotations, Match, Template } from 'aws-cdk-lib/assertions';
import { Runtime, Tracing } from 'aws-cdk-lib/aws-lambda';
import { describe, expect, it } from 'vitest';
import { CdkServiceStack } from '../src/index';

let stack: Stack;
let template: Template;

beforeEach(() => {
    const app = new App({
        context: {
            ...LambdaFunction.defineContext({
                timeout: Duration.seconds(6),
                memorySize: 192,
                runtime: Runtime.NODEJS_20_X,
                tracing: Tracing.ACTIVE,
                reservedConcurrentExecutions: 10,
                environment: {
                    NODE_OPTIONS: '--enable-source-maps',
                },
                bundling: {
                    sourceMap: true,
                },
                alias: 'LATEST',
            }),
            ...StepFunctionFromFile.defineContext({
                tracingEnabled: true,
                alias: 'LATEST',
            }),
            configFileName: 'test-config.json',
            // This feature flag prevents bundling lambda functions when running tests
            'aws:cdk:bundling-stacks': [],
        },
    });

    stack = new CdkServiceStack(app, 'TestStack');

    Aspects.of(stack).add(new MicroserviceChecks());

    template = Template.fromStack(stack);
});

describe('CdkNag', () => {
    it('should pass Microservices cdk-nag checks', () => {
        const errors = Annotations.fromStack(stack).findError(
            '*',
            Match.stringLikeRegexp('Microservices.*')
        );

        if (errors.length > 0) {
            console.log(errors);
        }

        expect(
            errors,
            'Microservice checks failed - inspect console logs for details'
        ).toHaveLength(0);
    });
});

describe('CdkServiceStack', () => {
    it('should create a single S3 bucket', () => {
        template.resourceCountIs('AWS::S3::Bucket', 1);
    });

    it('should create a single DynamoDB table', () => {
        template.resourceCountIs('AWS::DynamoDB::Table', 1);
    });

    it('should create a single Step Functions state machine', () => {
        template.resourceCountIs('AWS::StepFunctions::StateMachine', 1);
    });

    it('should pass configFileName from context to the Step Function', () => {
        template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
            DefinitionSubstitutions: {
                configFileName: 'test-config.json',
            },
        });
    });
});
