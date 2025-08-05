import {
    DevelopmentApplicationStage,
    ProductionApplicationStage,
    StagingApplicationStage,
} from '@libs/cdk-utils/infra';
import { type StageProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { createApplicationStacks } from './create-application-stacks';

/**
 * Environment-specific application stages
 *
 * These are the main entry points for the application in each stage.
 * Stage-specific modifications should be done only if necessary
 */

/**
 * Production environment
 */
export class Production extends ProductionApplicationStage {
    constructor(scope: Construct, props?: StageProps) {
        super(scope, props);

        // Create all application stacks
        createApplicationStacks(this, 'prd', props);
    }
}

/**
 * Staging environment
 */
export class Staging extends StagingApplicationStage {
    constructor(scope: Construct, props?: StageProps) {
        super(scope, props);

        // Create all application stacks
        createApplicationStacks(this, 'stg', props);
    }
}

/**
 * Development environment
 */
export class Development extends DevelopmentApplicationStage {
    constructor(scope: Construct, props?: StageProps) {
        super(scope, props);

        // Create all application stacks
        createApplicationStacks(this, 'dev', props);
    }
}
