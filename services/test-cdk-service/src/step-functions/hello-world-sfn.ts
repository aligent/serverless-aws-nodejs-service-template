import { IFunction } from 'aws-cdk-lib/aws-lambda';
import {
    CfnStateMachineAlias,
    CfnStateMachineVersion,
    DefinitionBody,
    Pass,
    QueryLanguage,
    StateMachine,
} from 'aws-cdk-lib/aws-stepfunctions';
import { LambdaInvoke } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';

export interface HelloWorldSfnProps {
    readonly helloFunction: IFunction;
    readonly worldFunction: IFunction;
    readonly stackName: string;
}

export class HelloWorldSfn extends Construct {
    constructor(scope: Construct, id: string, props: HelloWorldSfnProps) {
        super(scope, id);

        const { helloFunction, worldFunction, stackName } = props;

        const helloTask = new LambdaInvoke(this, 'Hello', {
            lambdaFunction: helloFunction,
            queryLanguage: QueryLanguage.JSONATA,
            outputs: '{% $states.result.Payload %}',
        });

        const worldTask = new LambdaInvoke(this, 'World', {
            lambdaFunction: worldFunction,
            queryLanguage: QueryLanguage.JSONATA,
            outputs: '{% $states.result.Payload %}',
        });

        const passthru = new Pass(this, 'Passthru');
        const stop = new Pass(this, 'Stop');

        const definition = helloTask.next(worldTask).next(passthru).next(stop);

        const helloWorldMachine = new StateMachine(this, 'HelloWorldStateMachine', {
            definitionBody: DefinitionBody.fromChainable(definition),
            tracingEnabled: true,
            stateMachineName: `${stackName}-helloWorld`,
        });

        const helloWorldVersion = new CfnStateMachineVersion(this, 'HelloWorldVersion', {
            stateMachineArn: helloWorldMachine.stateMachineArn,
        });

        new CfnStateMachineAlias(this, 'HelloWorldAlias', {
            name: 'LATEST',
            routingConfiguration: [
                {
                    stateMachineVersionArn: helloWorldVersion.attrArn,
                    weight: 100,
                },
            ],
        });
    }
}
