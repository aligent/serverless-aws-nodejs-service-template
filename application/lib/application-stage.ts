import { TestCdkServiceStack } from '@services/test-cdk-service';
import { Stage, type StageProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

/**
 * StageId can be any string, but it's strongly recommended to use
 * a 3 letter preset in most cases. This type uses a trick to provide
 * recommended options in intellisense while accepting any string.
 */
type StageId = 'dev' | 'stg' | 'prd' | (string & {});

export class ApplicationStage extends Stage {
    constructor(scope: Construct, stage: StageId, props?: StageProps) {
        super(scope, stage as string, props);

        new TestCdkServiceStack(this, 'brand-name-test-cdk', {
            ...props,
            stackName: `brand-name-test-cdk-${stage}`,
            description: 'Service template generated using Nx',
        });
    }
}
