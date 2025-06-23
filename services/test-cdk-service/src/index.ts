import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import path from 'node:path';
import { LambdaFunction } from './lib/constructs/lambda-function';
import { HelloWorldSfn } from './step-functions/hello-world-sfn';

export class TestCdkServiceStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const helloFunction = new LambdaFunction(this, 'hello', {
            entry: path.join(__dirname, '../lambda/hello.ts'),
        }).function;

        const worldFunction = new LambdaFunction(this, 'world', {
            entry: path.join(__dirname, '../lambda/world.ts'),
        }).function;

        new HelloWorldSfn(this, 'HelloWorldSfn', {
            helloFunction: helloFunction,
            worldFunction: worldFunction,
            stackName: this.stackName,
        });
    }
}
