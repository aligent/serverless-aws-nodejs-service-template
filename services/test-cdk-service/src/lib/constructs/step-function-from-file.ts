import type { Stack } from 'aws-cdk-lib';
import {
    CfnStateMachineAlias,
    CfnStateMachineVersion,
    DefinitionBody,
    StateMachine,
    type StateMachineProps,
} from 'aws-cdk-lib/aws-stepfunctions';

export interface StepFunctionFromFileProps extends StateMachineProps {
    readonly filepath: string;
}

export class StepFunctionFromFile extends StateMachine {
    constructor(scope: Stack, id: string, props: StepFunctionFromFileProps) {
        super(scope, id, {
            definitionBody: DefinitionBody.fromFile(props.filepath),
            // TODO: This is a hack to get the stack name into the state machine
            definitionSubstitutions: {
                stackName: scope.stackName,
            },
            tracingEnabled: true,
            stateMachineName: `${scope.stackName}-${id}`,
            role: props.role,
            ...props,
        });

        // const sentenceCaseId = `${id.charAt(0).toUpperCase()}${id.slice(1)}`;

        const version = new CfnStateMachineVersion(this, `Version`, {
            stateMachineArn: this.stateMachineArn,
        });

        new CfnStateMachineAlias(this, `Alias`, {
            name: 'LATEST',
            routingConfiguration: [
                {
                    stateMachineVersionArn: version.attrArn,
                    weight: 100,
                },
            ],
        });
    }
}
