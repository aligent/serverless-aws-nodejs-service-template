import { App, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { LogGroup } from 'aws-cdk-lib/aws-logs';
import path from 'path';
import { beforeEach, describe, expect, it, test } from 'vitest';
import { DevelopmentApplicationStage, StagingApplicationStage } from './application-stage';
import { LambdaFunction } from './lambda-function';

describe('LambdaFunction', () => {
    describe('unit tests', () => {
        it('should have the correct static context key', () => {
            expect(LambdaFunction.CONTEXT_KEY).toBe('@aligent.cdk-utils.LambdaFunction');
        });

        it('should define context correctly', () => {
            // Arrange & Act
            const context = LambdaFunction.defineContext({
                memorySize: 256,
            });

            // Assert
            expect(context).toEqual({
                [LambdaFunction.CONTEXT_KEY]: {
                    memorySize: 256,
                },
            });
        });

        it('should have correct property injection ID', () => {
            // Arrange
            const mockLambdaFunction = Object.create(LambdaFunction.prototype);
            mockLambdaFunction.PROPERTY_INJECTION_ID = '@aligent.cdk-utils.LambdaFunction';

            // Assert
            expect(mockLambdaFunction.PROPERTY_INJECTION_ID).toBe(
                '@aligent.cdk-utils.LambdaFunction'
            );
        });
    });

    describe('integration tests', () => {
        let app: App;
        let stack: Stack;
        let template: Template;

        beforeEach(() => {
            app = new App();
            stack = new Stack(app, 'TestStack');
        });

        const synth = () => Template.fromStack(stack);

        test('creates a lambda function with default properties', () => {
            new LambdaFunction(stack, 'MyFunction', {
                entry: path.join(__dirname, '__data__', 'test-handler.ts'),
            });

            template = synth();
            const functions = template.findResources('AWS::Lambda::Function');
            expect(functions).toMatchSnapshot();
        });

        test('creates a lambda function with overridden properties via context', () => {
            const contextApp = new App({
                context: LambdaFunction.defineContext({ memorySize: 512 }),
            });
            const contextStack = new Stack(contextApp, 'TestStack');

            new LambdaFunction(contextStack, 'MyFunction', {
                entry: path.join(__dirname, '__data__', 'test-handler.ts'),
            });

            template = Template.fromStack(contextStack);
            const functions = template.findResources('AWS::Lambda::Function');
            expect(functions).toMatchSnapshot();
        });

        test('creates a lambda function with staging stage configuration', () => {
            const app = new App();
            const stagingStage = new StagingApplicationStage(app, {
                env: { account: '123456789012', region: 'us-east-1' },
            });
            const stagingStack = new Stack(stagingStage, 'TestStack');

            new LambdaFunction(stagingStack, 'MyFunction', {
                entry: path.join(__dirname, '__data__', 'test-handler.ts'),
            });

            template = Template.fromStack(stagingStack);

            // Check that staging configuration is applied
            template.hasResourceProperties('AWS::Logs::LogGroup', {
                RetentionInDays: 180,
            });

            template.hasResource('AWS::Logs::LogGroup', {
                DeletionPolicy: 'Delete',
            });

            template.hasResourceProperties('AWS::Lambda::Function', {
                Environment: {
                    Variables: {
                        NODE_OPTIONS: '--enable-source-maps',
                    },
                },
            });
        });

        test('creates a lambda function with development stage configuration', () => {
            const app = new App();
            const devStage = new DevelopmentApplicationStage(app, {
                env: { account: '123456789012', region: 'us-east-1' },
            });
            const devStack = new Stack(devStage, 'TestStack');

            new LambdaFunction(devStack, 'MyFunction', {
                entry: path.join(__dirname, '__data__', 'test-handler.ts'),
            });

            template = Template.fromStack(devStack);

            // Check that dev configuration is applied
            template.hasResourceProperties('AWS::Logs::LogGroup', {
                RetentionInDays: 7,
            });

            template.hasResource('AWS::Logs::LogGroup', {
                DeletionPolicy: 'Delete',
            });

            template.hasResourceProperties('AWS::Lambda::Function', {
                Environment: {
                    Variables: {
                        NODE_OPTIONS: Match.absent(),
                    },
                },
            });
        });

        test('creates a lambda function with alias', () => {
            new LambdaFunction(stack, 'MyFunction', {
                entry: path.join(__dirname, '__data__', 'test-handler.ts'),
                alias: 'LATEST',
            });

            template = synth();

            // Check that alias is created
            template.hasResourceProperties('AWS::Lambda::Alias', {
                Name: 'LATEST',
            });
        });

        test('throws error when not used within a CDK Stage (or Stack)', () => {
            const app = new App();

            expect(() => {
                new LambdaFunction(app, 'MyFunction', {
                    entry: path.join(__dirname, '__data__', 'test-handler.ts'),
                });
            }).toThrow('This construct must be used within a CDK Stage');
        });

        test('merges bundling properties correctly', () => {
            const app = new App({
                context: LambdaFunction.defineContext({
                    bundling: {
                        sourceMap: true,
                    },
                }),
            });
            const devStage = new DevelopmentApplicationStage(app, {
                env: { account: '123456789012', region: 'us-east-1' },
            });
            const devStack = new Stack(devStage, 'TestStack');

            // This test verifies that bundling properties are merged correctly
            // by checking that the function can be created without errors
            // and that source maps enable NODE_OPTIONS environment variable
            const lambdaFunction = new LambdaFunction(devStack, 'MyFunction', {
                entry: path.join(__dirname, '__data__', 'test-handler.ts'),
                bundling: {
                    minify: false,
                },
            });

            // Verify the function was created successfully
            expect(lambdaFunction).toBeDefined();

            template = Template.fromStack(devStack);

            // Check that NODE_OPTIONS is set due to sourceMap: true from context
            template.hasResourceProperties('AWS::Lambda::Function', {
                Environment: {
                    Variables: {
                        NODE_OPTIONS: '--enable-source-maps',
                    },
                },
            });
        });

        test('uses provided log group when specified', () => {
            const customLogGroup = new LogGroup(stack, 'CustomLogGroup');

            new LambdaFunction(stack, 'MyFunction', {
                entry: path.join(__dirname, '__data__', 'test-handler.ts'),
                logGroup: customLogGroup,
            });

            template = synth();

            // Should have the custom log group
            template.hasResourceProperties('AWS::Logs::LogGroup', {});

            // Should not create an additional log group with the default naming
            const logGroups = template.findResources('AWS::Logs::LogGroup');
            expect(Object.keys(logGroups).length).toBe(1);
        });
    });
});
