import { Stack, StackProps } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { DefinitionBody, Pass, StateMachine } from 'aws-cdk-lib/aws-stepfunctions';
import { LambdaInvoke } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';
import path from 'node:path';

export class TestCdkServiceStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const helloFunction = new NodejsFunction(this, 'HelloFunction', {
            entry: path.join(__dirname, '../lambda/hello.ts'),
            handler: 'handler',
        });

        const worldFunction = new NodejsFunction(this, 'WorldFunction', {
            entry: path.join(__dirname, '../lambda/world.ts'),
            handler: 'handler',
        });

        const helloTask = new LambdaInvoke(this, 'Hello', {
            lambdaFunction: helloFunction,
        });

        const worldTask = new LambdaInvoke(this, 'World', {
            lambdaFunction: worldFunction,
        });

        const passthru = new Pass(this, 'Passthru');
        const stop = new Pass(this, 'Stop');

        const definition = helloTask.next(worldTask).next(passthru).next(stop);

        new StateMachine(this, 'HelloWorldStateMachine', {
            definitionBody: DefinitionBody.fromChainable(definition),
            tracingEnabled: true,
        });
    }
}
