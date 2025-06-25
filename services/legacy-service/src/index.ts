import { LambdaFunction, StepFunctionFromFile } from '@aligent/cdk-utils';
import { Stack, StackProps, Stage, Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import path from 'node:path';

export class LegacyStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const helloLambda = new LambdaFunction(this, 'hello', {
            entry: path.join(__dirname, 'lambda/hello.ts'),
        });

        const worldLambda = new LambdaFunction(this, 'world', {
            entry: path.join(__dirname, 'lambda/world.ts'),
        });

        const stageName = Stage.of(this)?.stageName || 'dev';

        const helloWorldSfn = new StepFunctionFromFile(this, 'helloWorld', {
            filepath: path.join(__dirname, 'step-functions/hello-world-machine.asl.yaml'),
            // Replace ${stackName} with the resource prefix so lambda functions can be found
            definitionSubstitutions: {
                stackName: `${id}-${stageName}`,
            },
        });

        helloLambda.grantInvoke(helloWorldSfn);
        worldLambda.grantInvoke(helloWorldSfn);

        Tags.of(this).add('SERVICE', id);
    }
}
