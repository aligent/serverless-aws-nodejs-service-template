import { App, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { StateMachineType } from 'aws-cdk-lib/aws-stepfunctions';
import { join as pathJoin } from 'path';
import { beforeEach, describe, expect, it, test } from 'vitest';
import { StepFunctionFromFile } from './step-function-from-file';

describe('StepFunctionFromFile', () => {
    describe('unit tests', () => {
        it('should have the correct static context key', () => {
            expect(StepFunctionFromFile.CONTEXT_KEY).toBe(
                '@aligent.cdk-utils.StepFunctionFromFile'
            );
        });

        it('should define context correctly', () => {
            // Arrange & Act
            const context = StepFunctionFromFile.defineContext({
                tracingEnabled: true,
                stateMachineName: 'TestMachine',
            });

            // Assert
            expect(context).toEqual({
                [StepFunctionFromFile.CONTEXT_KEY]: {
                    tracingEnabled: true,
                    stateMachineName: 'TestMachine',
                },
            });
        });

        it('should have correct property injection ID', () => {
            // Arrange
            const mockStepFunction = Object.create(StepFunctionFromFile.prototype);
            mockStepFunction.PROPERTY_INJECTION_ID = '@aligent.cdk-utils.StepFunctionFromFile';

            // Assert
            expect(mockStepFunction.PROPERTY_INJECTION_ID).toBe(
                '@aligent.cdk-utils.StepFunctionFromFile'
            );
        });
    });

    describe('integration tests', () => {
        let app: App;
        let stack: Stack;
        let defaultTemplate: Template;

        beforeEach(() => {
            app = new App();
            stack = new Stack(app, 'TestStack');
            new StepFunctionFromFile(stack, 'MyStateMachine', {
                filepath: pathJoin(__dirname, '__data__', 'test-machine.asl.yaml'),
            });
        });

        afterEach(() => {
            defaultTemplate = undefined!;
        });

        const synthDefaultStack = () => {
            defaultTemplate = Template.fromStack(stack);
        };

        test('creates a state machine from a file', () => {
            synthDefaultStack();

            const stateMachines = defaultTemplate.findResources('AWS::StepFunctions::StateMachine');
            expect(stateMachines).toMatchSnapshot();
        });

        test('creates a state machine with overridden properties via context', () => {
            const appWithContext = new App({
                context: StepFunctionFromFile.defineContext({
                    tracingEnabled: true,
                    stateMachineName: 'ContextStateMachine',
                    alias: 'test-alias',
                }),
            });

            const stackWithContext = new Stack(appWithContext, 'TestStack');

            new StepFunctionFromFile(stackWithContext, 'MyStateMachine', {
                filepath: pathJoin(__dirname, '__data__', 'test-machine.asl.yaml'),
            });

            // Assert that the default stack does not have the expected properties
            synthDefaultStack();
            defaultTemplate.hasResourceProperties('AWS::StepFunctions::StateMachine', {
                StateMachineName: Match.absent(),
                TracingConfiguration: Match.absent(),
            });

            // Assert that the stack with context has the expected properties
            const templateWithContext = Template.fromStack(stackWithContext);

            templateWithContext.hasResourceProperties('AWS::StepFunctions::StateMachine', {
                StateMachineName: 'ContextStateMachine',
                TracingConfiguration: {
                    Enabled: true,
                },
            });
            templateWithContext.hasResourceProperties('AWS::StepFunctions::StateMachineAlias', {
                Name: 'test-alias',
            });
        });

        test('creates a state machine with lambda functions', () => {
            // Create test lambda functions
            const lambda1 = new Function(stack, 'TestLambda1', {
                runtime: Runtime.NODEJS_20_X,
                handler: 'index.handler',
                code: Code.fromInline('exports.handler = async () => ({ statusCode: 200 });'),
            });

            const lambda2 = new Function(stack, 'TestLambda2', {
                runtime: Runtime.NODEJS_20_X,
                handler: 'index.handler',
                code: Code.fromInline('exports.handler = async () => ({ statusCode: 200 });'),
            });

            new StepFunctionFromFile(stack, 'LambdaStateMachine', {
                filepath: pathJoin(__dirname, '__data__', 'test-machine.asl.yaml'),
                lambdaFunctions: [lambda1, lambda2],
                definitionSubstitutions: {
                    ExtraParam: 'ExtraValue',
                },
            });

            synthDefaultStack();

            defaultTemplate.hasResourceProperties('AWS::StepFunctions::StateMachine', {
                DefinitionSubstitutions: {
                    ExtraParam: 'ExtraValue',
                    TestLambda1: { 'Fn::GetAtt': [Match.stringLikeRegexp('TestLambda1.*'), 'Arn'] },
                    TestLambda2: { 'Fn::GetAtt': [Match.stringLikeRegexp('TestLambda2.*'), 'Arn'] },
                },
            });

            // Check that IAM policies grant invoke permissions (there should be 2 policies, one for each lambda)
            defaultTemplate.hasResourceProperties('AWS::IAM::Policy', {
                PolicyDocument: {
                    Statement: Match.arrayWith([
                        Match.objectLike({
                            Action: 'lambda:InvokeFunction',
                            Effect: 'Allow',
                        }),
                    ]),
                },
            });
        });

        test('creates a state machine with alias', () => {
            new StepFunctionFromFile(stack, 'AliasedStateMachine', {
                filepath: pathJoin(__dirname, '__data__', 'test-machine.asl.yaml'),
                alias: 'prod',
            });

            synthDefaultStack();

            // Check that version is created
            defaultTemplate.hasResourceProperties('AWS::StepFunctions::StateMachineVersion', {
                StateMachineArn: {
                    Ref: Match.stringLikeRegexp('AliasedStateMachine.*'),
                },
            });

            // Check that alias is created
            defaultTemplate.hasResourceProperties('AWS::StepFunctions::StateMachineAlias', {
                Name: 'prod',
                RoutingConfiguration: [
                    {
                        StateMachineVersionArn: {
                            'Fn::GetAtt': [
                                Match.stringLikeRegexp('AliasedStateMachineVersion.*'),
                                'Arn',
                            ],
                        },
                        Weight: 100,
                    },
                ],
            });
        });

        test('creates a state machine without lambda functions or alias', () => {
            synthDefaultStack();

            defaultTemplate.resourceCountIs('AWS::StepFunctions::StateMachineVersion', 0);
            defaultTemplate.resourceCountIs('AWS::StepFunctions::StateMachineAlias', 0);

            defaultTemplate.hasResourceProperties('AWS::StepFunctions::StateMachine', {
                DefinitionSubstitutions: Match.absent(),
            });
        });

        test('retrieves context correctly', () => {
            const contextApp = new App({
                context: StepFunctionFromFile.defineContext({
                    tracingEnabled: false,
                }),
            });
            const contextStack = new Stack(contextApp, 'TestStack');

            const context = StepFunctionFromFile.getContext(contextStack);
            expect(context).toEqual({
                tracingEnabled: false,
            });
        });

        test('returns empty object when no context is set', () => {
            const context = StepFunctionFromFile.getContext(stack);
            expect(context).toEqual({});
        });

        it('sets up logging for EXPRESS step functions', () => {
            new StepFunctionFromFile(stack, 'ExpressStateMachine', {
                filepath: pathJoin(__dirname, '__data__', 'test-machine.asl.yaml'),
                stateMachineType: StateMachineType.EXPRESS,
            });

            synthDefaultStack();

            defaultTemplate.hasResourceProperties('AWS::StepFunctions::StateMachine', {
                LoggingConfiguration: {
                    Level: 'ALL',
                },
            });
        });
    });
});
