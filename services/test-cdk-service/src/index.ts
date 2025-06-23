import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import path from 'node:path';
import { LambdaFunction } from './lib/constructs/lambda-function';
import { StepFunctionFromFile } from './lib/constructs/step-function-from-file';

export class TestCdkServiceStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const helloLambda = new LambdaFunction(this, 'hello', {
            entry: path.join(__dirname, 'lambda/hello.ts'),
        });

        const worldLambda = new LambdaFunction(this, 'world', {
            entry: path.join(__dirname, 'lambda/world.ts'),
        });

        const helloWorldSfn = new StepFunctionFromFile(this, 'helloWorld', {
            filepath: path.join(__dirname, 'step-functions/hello-world-machine.asl.yaml'),
        });

        helloLambda.grantInvoke(helloWorldSfn);
        worldLambda.grantInvoke(helloWorldSfn);

        const configBucket = new Bucket(this, 'configBucket', {
            bucketName: `${this.stackName}-config`,
            versioned: true,
            autoDeleteObjects: true,
            removalPolicy: RemovalPolicy.DESTROY,
        });

        const cacheTable = new Table(this, 'cacheTable', {
            tableName: `${this.stackName}-cache`,
            partitionKey: { name: 'id', type: AttributeType.STRING },
            removalPolicy: RemovalPolicy.DESTROY,
        });

        const randomNumberSfn = new StepFunctionFromFile(this, 'randomNumber', {
            filepath: path.join(__dirname, 'step-functions/random-number-machine.asl.yaml'),
        });

        configBucket.grantRead(randomNumberSfn);
        cacheTable.grantWriteData(randomNumberSfn);
    }
}
