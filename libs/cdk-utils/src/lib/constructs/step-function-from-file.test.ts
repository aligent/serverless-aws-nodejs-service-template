import { Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { join as pathJoin } from 'path';
import { beforeEach, describe, expect, test } from 'vitest';
import { StepFunctionFromFile } from './step-function-from-file';

describe('StepFunctionFromFile', () => {
    let stack: Stack;

    beforeEach(() => {
        stack = new Stack();
        new StepFunctionFromFile(stack, 'MyStateMachine', {
            filepath: pathJoin(__dirname, '__data__', 'test-machine.asl.yaml'),
        });
    });

    test('creates a state machine from a file', () => {
        const template = Template.fromStack(stack);

        const stateMachines = template.findResources('AWS::StepFunctions::StateMachine');
        expect(stateMachines).toMatchSnapshot();
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

        const template = Template.fromStack(stack);

        template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
            DefinitionSubstitutions: {
                ExtraParam: 'ExtraValue',
                TestLambda1: { 'Fn::GetAtt': [Match.stringLikeRegexp('TestLambda1.*'), 'Arn'] },
                TestLambda2: { 'Fn::GetAtt': [Match.stringLikeRegexp('TestLambda2.*'), 'Arn'] },
            },
        });

        // Check that IAM policies grant invoke permissions (there should be 2 policies, one for each lambda)
        template.hasResourceProperties('AWS::IAM::Policy', {
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
});
