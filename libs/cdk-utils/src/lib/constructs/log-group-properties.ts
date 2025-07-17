import { type Stage, RemovalPolicy } from 'aws-cdk-lib';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { DevelopmentApplicationStage, StagingApplicationStage } from './application-stage';

/**
 * Get stage-specific log group properties
 *
 * Development and staging log groups don't need to last forever
 * and should be cleaned up along with their stack when removed
 *
 * @param stage - The stage to get the log group properties for
 * @returns The log group properties for the stage
 */
export function logGroupProperties(stage: Stage) {
    const devConfig = {
        retention: RetentionDays.ONE_WEEK,
        removalPolicy: RemovalPolicy.DESTROY,
    };

    const stagingConfig = {
        retention: RetentionDays.SIX_MONTHS,
        removalPolicy: RemovalPolicy.DESTROY,
    };

    const productionConfig = {
        retention: RetentionDays.TWO_YEARS,
        removalPolicy: RemovalPolicy.RETAIN,
    };

    switch (true) {
        case stage instanceof DevelopmentApplicationStage:
            return devConfig;
        case stage instanceof StagingApplicationStage:
            return stagingConfig;
        default:
            return productionConfig;
    }
}
