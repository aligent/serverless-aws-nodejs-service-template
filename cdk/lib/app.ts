import { TestCdkServiceStack } from '@services/test-cdk-service';
import { Stage, type StageProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class Application extends Stage {
    constructor(scope: Construct, id: string, props?: StageProps) {
        super(scope, id, props);

        new TestCdkServiceStack(this, 'TestCdkServiceStack', props);
    }
}
