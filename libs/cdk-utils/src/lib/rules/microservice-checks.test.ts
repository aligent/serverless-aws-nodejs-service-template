import { App, Aspects, Stack } from 'aws-cdk-lib';
import { Annotations, Match } from 'aws-cdk-lib/assertions';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { beforeAll, describe, expect, it } from 'vitest';
import { MicroserviceChecks } from './microservice-checks';

describe('MicroserviceChecks', () => {
    it('should have the correct pack name', () => {
        const checks = new MicroserviceChecks();

        expect(checks.readPackName).toBe('Microservices');
    });

    it('should instantiate with props', () => {
        const checks = new MicroserviceChecks({ verbose: true });

        expect(checks).toBeInstanceOf(MicroserviceChecks);
    });

    it('should instantiate without props', () => {
        const checks = new MicroserviceChecks();

        expect(checks).toBeInstanceOf(MicroserviceChecks);
    });

    it('should have a visit method', () => {
        const checks = new MicroserviceChecks();

        expect(typeof checks.visit).toBe('function');
    });

    describe('visit', () => {
        let annotations: Annotations;

        beforeAll(() => {
            const app = new App({
                context: {
                    'aws:cdk:bundling-stacks': [],
                },
            });
            const stack = new Stack(app, 'TestStack');
            const checks = new MicroserviceChecks();
            Aspects.of(stack).add(checks);

            new Function(stack, 'TestFunction', {
                runtime: Runtime.NODEJS_22_X,
                handler: 'index.handler',
                code: Code.fromInline('exports.handler = () => {};'),
            });

            new LogGroup(stack, 'TestLogGroup', {
                logGroupName: 'TestLogGroup',
                // The LogGroup construct defaults to 731 day retention, actually have to explicitly
                // use RetentionDays.INFINITE to get a resource with no retention set
                retention: RetentionDays.INFINITE,
            });

            // Act
            annotations = Annotations.fromStack(stack);
        });

        it('should trigger a rule if the lambda does not have an explicit memory value configured', () => {
            annotations.hasError(
                '/TestStack/TestFunction/Resource',
                Match.stringLikeRegexp('does not have an explicit memory value configured')
            );
        });

        it('should trigger a rule if the lambda does not have an explicit timeout value configured', () => {
            annotations.hasError(
                '/TestStack/TestFunction/Resource',
                Match.stringLikeRegexp('does not have an explicitly defined timeout value')
            );
        });

        it('should trigger a rule if the lambda does not have tracing set to active', () => {
            annotations.hasError(
                '/TestStack/TestFunction/Resource',
                Match.stringLikeRegexp('does not have tracing set to Tracing.ACTIVE')
            );
        });

        it('should trigger a rule if the cloudwatch log group does not have an explicit retention policy', () => {
            annotations.hasError(
                '/TestStack/TestLogGroup/Resource',
                Match.stringLikeRegexp('does not have an explicit retention policy')
            );
        });
    });
});
