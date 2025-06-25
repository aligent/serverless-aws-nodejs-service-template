import {
    CfnStateMachineAlias,
    CfnStateMachineVersion,
    DefinitionBody,
    StateMachine,
    type StateMachineProps,
} from 'aws-cdk-lib/aws-stepfunctions';
import { propertyInjectable } from 'aws-cdk-lib/core/lib/prop-injectable';
import { Construct } from 'constructs';

export interface StepFunctionFromFileProps extends StateMachineProps {
    readonly filepath: string;
    readonly alias?: string;
}

@propertyInjectable
export class StepFunctionFromFile extends StateMachine {
    readonly PROPERTY_INJECTION_ID = '@aligent.cdk-utils.StepFunctionFromFile';

    constructor(scope: Construct, id: string, props: StepFunctionFromFileProps) {
        const defaults = scope.node.tryGetContext('step-function') || {};

        super(scope, id, {
            definitionBody: DefinitionBody.fromFile(props.filepath),
            ...defaults,
            ...props,
        });

        if (props.alias) {
            const version = new CfnStateMachineVersion(this, `Version`, {
                stateMachineArn: this.stateMachineArn,
            });

            new CfnStateMachineAlias(this, `Alias`, {
                name: props.alias,
                routingConfiguration: [
                    {
                        stateMachineVersionArn: version.attrArn,
                        weight: 100,
                    },
                ],
            });
        }
    }
}
