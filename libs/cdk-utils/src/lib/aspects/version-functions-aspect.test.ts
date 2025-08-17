import { Aspects, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { Code } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import path from 'node:path';
import { StepFunctionFromFile } from '../constructs/step-function-from-file';
import { VersionFunctionsAspect } from './version-functions-aspect';

describe('VersionResourcesAspect', () => {
    let stack: Stack;

    beforeEach(() => {
        stack = new Stack();
        Aspects.of(stack).add(new VersionFunctionsAspect());
    });

    it('should add a version and alias to a lambda function', () => {
        new NodejsFunction(stack, 'TestFunction', {
            handler: 'index.handler',
            code: Code.fromInline('exports.handler = async () => ({ statusCode: 200 });'),
        });

        const template = Template.fromStack(stack);
        template.hasResourceProperties('AWS::Lambda::Alias', {
            Name: 'LATEST',
        });
    });

    it('should add a custom alias to a lambda function', () => {
        new NodejsFunction(stack, 'TestFunction', {
            handler: 'index.handler',
            code: Code.fromInline('exports.handler = async () => ({ statusCode: 200 });'),
        });

        Aspects.of(stack).add(new VersionFunctionsAspect({ alias: 'PROD' }));

        const template = Template.fromStack(stack);
        template.hasResourceProperties('AWS::Lambda::Alias', {
            Name: 'PROD',
        });
    });

    it('should add a version and alias to a step function', () => {
        new StepFunctionFromFile(stack, 'TestStepFunction', {
            filepath: path.join(__dirname, '__data__', 'test-machine.asl.yaml'),
        });

        const template = Template.fromStack(stack);

        const versionId = template.getResourceId('AWS::StepFunctions::StateMachineVersion');

        template.hasResourceProperties('AWS::StepFunctions::StateMachineAlias', {
            Name: 'LATEST',
            RoutingConfiguration: [
                {
                    StateMachineVersionArn: {
                        'Fn::GetAtt': [versionId, 'Arn'],
                    },
                    Weight: 100,
                },
            ],
        });
    });
});
