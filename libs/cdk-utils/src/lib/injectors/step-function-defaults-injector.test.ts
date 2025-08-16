import { PropertyInjectors, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { DefinitionBody, StateMachine, StateMachineType } from 'aws-cdk-lib/aws-stepfunctions';
import { join } from 'node:path';
import { StepFunctionDefaultsInjector } from './step-function-defaults-injector';

describe('StepFunctionDefaultsInjector', () => {
    let stack: Stack;

    beforeEach(() => {
        stack = new Stack();
        PropertyInjectors.of(stack).add(new StepFunctionDefaultsInjector());
    });

    it('Creates a log group for EXPRESS step functions', () => {
        new StateMachine(stack, 'ExpressStateMachine', {
            definitionBody: DefinitionBody.fromFile(
                join(__dirname, '__data__', 'test-machine.asl.yaml')
            ),
            stateMachineType: StateMachineType.EXPRESS,
        });

        const template = Template.fromStack(stack);

        const logGroupId = template.getResourceId('AWS::Logs::LogGroup');
        template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
            LoggingConfiguration: {
                Destinations: [
                    {
                        CloudWatchLogsLogGroup: {
                            LogGroupArn: {
                                'Fn::GetAtt': [logGroupId, 'Arn'],
                            },
                        },
                    },
                ],
            },
        });
    });

    it('Does not create a log group for STANDARD step functions', () => {
        new StateMachine(stack, 'StateMachine', {
            definitionBody: DefinitionBody.fromFile(
                join(__dirname, '__data__', 'test-machine.asl.yaml')
            ),
        });

        const template = Template.fromStack(stack);

        template.resourceCountIs('AWS::Logs::LogGroup', 0);
    });
});
