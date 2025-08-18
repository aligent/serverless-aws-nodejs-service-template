import { Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { Code, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { join as pathJoin } from 'path';
import { beforeEach, describe, expect, test } from 'vitest';
import { StepFunctionFromFile } from './step-function-from-file';

const snapshotMessage = 'Rerun tests with the -u flag to update snapshots if changes are expected';

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
        expect(stateMachines).toMatchSnapshot(snapshotMessage);
    });

    test('creates a state machine with lambda functions', () => {
        // Create test lambda functions
        const lambda = new NodejsFunction(stack, 'TestFunction', {
            runtime: Runtime.NODEJS_22_X,
            handler: 'index.handler',
            code: Code.fromInline('exports.handler = async () => ({ statusCode: 200 });'),
        });

        const otherLambda = new NodejsFunction(stack, 'OtherTestFunction', {
            runtime: Runtime.NODEJS_22_X,
            handler: 'index.handler',
            code: Code.fromInline('exports.handler = async () => ({ statusCode: 200 });'),
        });

        new StepFunctionFromFile(stack, 'LambdaStateMachine', {
            filepath: pathJoin(__dirname, '__data__', 'test-machine.asl.yaml'),
            lambdaFunctions: [lambda, otherLambda],
            definitionSubstitutions: {
                ExtraParam: 'ExtraValue',
            },
        });

        const template = Template.fromStack(stack);

        template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
            DefinitionSubstitutions: {
                ExtraParam: 'ExtraValue',
                TestFunction: { 'Fn::GetAtt': [Match.stringLikeRegexp('TestFunction.*'), 'Arn'] },
                OtherTestFunction: {
                    'Fn::GetAtt': [Match.stringLikeRegexp('OtherTestFunction.*'), 'Arn'],
                },
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
