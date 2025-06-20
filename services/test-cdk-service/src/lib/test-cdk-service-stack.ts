import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Runtime, Tracing } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import {
    CfnStateMachineAlias,
    CfnStateMachineVersion,
    DefinitionBody,
    Pass,
    StateMachine,
} from 'aws-cdk-lib/aws-stepfunctions';
import { LambdaInvoke } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';
import path from 'node:path';

export class TestCdkServiceStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const helloFunction = new NodejsFunction(this, 'hello', {
            functionName: `${this.stackName}-hello`,
            entry: path.join(__dirname, '../lambda/hello.ts'),
            handler: 'handler',
            timeout: Duration.seconds(6),
            memorySize: 192,
            runtime: Runtime.NODEJS_20_X,
            tracing: Tracing.ACTIVE,
            environment: {
                NODE_OPTIONS: '--enable-source-maps',
            },
            bundling: {
                sourceMap: true,
            },
        });

        helloFunction.addAlias('LATEST');

        const worldFunction = new NodejsFunction(this, 'world', {
            functionName: `${this.stackName}-world`,
            entry: path.join(__dirname, '../lambda/world.ts'),
            handler: 'handler',
            timeout: Duration.seconds(6),
            memorySize: 192,
            runtime: Runtime.NODEJS_20_X,
            tracing: Tracing.ACTIVE,
            environment: {
                NODE_OPTIONS: '--enable-source-maps',
            },
            bundling: {
                sourceMap: true,
            },
        });

        worldFunction.addAlias('LATEST');

        const helloTask = new LambdaInvoke(this, 'Hello', {
            lambdaFunction: helloFunction,
        });

        const worldTask = new LambdaInvoke(this, 'World', {
            lambdaFunction: worldFunction,
        });

        const passthru = new Pass(this, 'Passthru');
        const stop = new Pass(this, 'Stop');

        const definition = helloTask.next(worldTask).next(passthru).next(stop);

        const helloWorldMachine = new StateMachine(this, 'HelloWorldStateMachine', {
            definitionBody: DefinitionBody.fromChainable(definition),
            tracingEnabled: true,
            stateMachineName: `${this.stackName}-helloWorld`,
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
