import { CdkServiceStack } from '@services/cdk-service';
import { Stage, Tags, type StageProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

/**
 * StageId can be any string, but it's strongly recommended to use
 * a 3 letter preset. This type uses a trick to provide recommended
 * options in intellisense while accepting any string.
 */
type StageId = 'dev' | 'stg' | 'prd' | (string & {});

/**
 * ApplicationStage is the main repeatable unit of deployment.
 * It should contain all the stacks required by this application
 */
export class ApplicationStage extends Stage {
    constructor(scope: Construct, stage: StageId, props?: StageProps) {
        super(scope, stage as string, props);

        new CdkServiceStack(this, 'cdk-service', {
            ...props,
            description: 'CDK service template generated using Nx',
        });

        Tags.of(this).add('STAGE', stage);
    }
}
