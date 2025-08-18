import { App, Stack, Stage } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { beforeEach, describe, expect, test } from 'vitest';
import { SsmParameterGroup } from './ssm-parameter-group';

const snapshotMessage = 'Rerun tests with the -u flag to update snapshots if changes are expected';

class TestParameters extends SsmParameterGroup<'PARAM_ONE' | 'PARAM_TWO'> {
    public readonly parameters;

    constructor(scope: Construct, id: string) {
        super(scope, id);

        const PARAM_ONE = new StringParameter(this, 'Param1', {
            parameterName: '/test/param1',
            stringValue: 'value1',
        });

        const PARAM_TWO = new StringParameter(this, 'Param2', {
            parameterName: '/test/param2',
            stringValue: 'value2',
        });

        this.parameters = {
            PARAM_ONE,
            PARAM_TWO,
        } as const;
    }
}

describe('SsmParameterGroup', () => {
    let stack: Stack;
    let template: Template;
    let testParameters: TestParameters;
    let lambda: Function;
    let lambda2: Function;

    beforeEach(() => {
        const app = new App();
        const stage = new Stage(app, 'TestStage');
        stack = new Stack(stage, 'TestStack');
        testParameters = new TestParameters(stack, 'MyTestParameters');
        lambda = new NodejsFunction(stack, 'TestFunction', {
            runtime: Runtime.NODEJS_22_X,
            handler: 'index.handler',
            code: Code.fromInline('exports.handler = async () => ({ statusCode: 200 });'),
        });
        lambda2 = new NodejsFunction(stack, 'OtherTestFunction', {
            runtime: Runtime.NODEJS_22_X,
            handler: 'index.handler',
            code: Code.fromInline('exports.handler = async () => ({ statusCode: 200 });'),
        });
    });

    const synth = () => Template.fromStack(stack);

    const getFunctionAndPolicySnapshots = () => {
        const functions = template.findResources('AWS::Lambda::Function');
        const policies = template.findResources('AWS::IAM::Policy');
        return { functions, policies };
    };

    test('grantToFunction with "read" permission', () => {
        testParameters.grantToFunction(lambda, 'read');
        template = synth();

        const { functions, policies } = getFunctionAndPolicySnapshots();
        expect(functions).toMatchSnapshot(snapshotMessage);
        expect(policies).toMatchSnapshot(snapshotMessage);
    });

    test('grantToFunction with "write" permission', () => {
        testParameters.grantToFunction(lambda, 'write');
        template = synth();

        const { functions, policies } = getFunctionAndPolicySnapshots();
        expect(functions).toMatchSnapshot(snapshotMessage);
        expect(policies).toMatchSnapshot(snapshotMessage);
    });

    test('grantToFunction with "readwrite" permission', () => {
        testParameters.grantToFunction(lambda, 'readwrite');
        template = synth();

        const { functions, policies } = getFunctionAndPolicySnapshots();
        expect(functions).toMatchSnapshot(snapshotMessage);
        expect(policies).toMatchSnapshot(snapshotMessage);
    });

    test('grantToFunctions grants to multiple functions', () => {
        testParameters.grantToFunctions([lambda, lambda2], 'read');
        template = synth();

        const { functions, policies } = getFunctionAndPolicySnapshots();
        expect(functions).toMatchSnapshot(snapshotMessage);
        expect(policies).toMatchSnapshot(snapshotMessage);
    });
});
