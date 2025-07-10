import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { beforeEach, describe, expect, test } from 'vitest';

import { SsmParameterGroup } from './ssm-parameter-group';

class TestParameters extends SsmParameterGroup {
    public readonly parameters;

    constructor(scope: Construct, id: string) {
        super(scope, id);

        const param1 = new StringParameter(this, 'Param1', {
            parameterName: '/test/param1',
            stringValue: 'value1',
        });

        const param2 = new StringParameter(this, 'Param2', {
            parameterName: '/test/param2',
            stringValue: 'value2',
        });

        this.parameters = {
            PARAM_ONE: param1,
            PARAM_TWO: param2,
        } as const;
    }
}

describe('SsmParameterGroup', () => {
    let app: App;
    let stack: Stack;
    let template: Template;
    let testParameters: TestParameters;
    let lambda: Function;
    let lambda2: Function;

    beforeEach(() => {
        app = new App();
        stack = new Stack(app, 'TestStack');
        testParameters = new TestParameters(stack, 'MyTestParameters');
        lambda = new Function(stack, 'MyTestFunction', {
            runtime: Runtime.NODEJS_20_X,
            code: Code.fromInline('foo'),
            handler: 'index.handler',
        });
        lambda2 = new Function(stack, 'MyOtherTestFunction', {
            runtime: Runtime.NODEJS_20_X,
            code: Code.fromInline('foo'),
            handler: 'index.handler',
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
        expect(functions).toMatchSnapshot();
        expect(policies).toMatchSnapshot();
    });

    test('grantToFunction with "write" permission', () => {
        testParameters.grantToFunction(lambda, 'write');
        template = synth();

        const { functions, policies } = getFunctionAndPolicySnapshots();
        expect(functions).toMatchSnapshot();
        expect(policies).toMatchSnapshot();
    });

    test('grantToFunction with "readwrite" permission', () => {
        testParameters.grantToFunction(lambda, 'readwrite');
        template = synth();

        const { functions, policies } = getFunctionAndPolicySnapshots();
        expect(functions).toMatchSnapshot();
        expect(policies).toMatchSnapshot();
    });

    test('grantToFunctions grants to multiple functions', () => {
        testParameters.grantToFunctions([lambda, lambda2], 'read');
        template = synth();

        const { functions, policies } = getFunctionAndPolicySnapshots();
        expect(functions).toMatchSnapshot();
        expect(policies).toMatchSnapshot();
    });
});
