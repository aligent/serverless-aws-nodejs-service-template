import { Aspects, Stage, Tags, type StageProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { FunctionBundleAnalyzerAspect } from '../aspects/function-bundle-analyzer';
import { LambdaFunction } from './lambda-function';

abstract class BaseApplicationStage extends Stage {
    static readonly DEFAULT_STAGES = {
        development: 'dev',
        staging: 'stg',
        production: 'prd',
    } as const;
}

type DefaultStageOptions = typeof BaseApplicationStage.DEFAULT_STAGES;
type DefaultStageId = DefaultStageOptions[keyof DefaultStageOptions];

/**
 * Constructor for stages with a custom id.
 *
 * Use of standard stage ids will throw an error.
 */
export class CustomApplicationStage extends BaseApplicationStage {
    constructor(scope: Construct, stage: string, props?: StageProps) {
        if (Object.values(BaseApplicationStage.DEFAULT_STAGES).includes(stage as DefaultStageId)) {
            throw new Error(
                `Stage ID ${stage} is reserved for default stages, use the appropriate constructor`
            );
        }
        super(scope, stage, props);
    }
}

/**
 * Development ApplicationStage
 *
 * Adds an appropriate stage tag.
 * Adds the FunctionBundleAnalyzerAspect.
 */
export class DevelopmentApplicationStage extends BaseApplicationStage {
    constructor(scope: Construct, props?: StageProps) {
        super(scope, BaseApplicationStage.DEFAULT_STAGES.development, props);

        Tags.of(this).add('STAGE', BaseApplicationStage.DEFAULT_STAGES.development);

        // This aspect enables using the `analyze:function` npm script to
        // display bundle analyses for lambda functions
        Aspects.of(this).add(
            new FunctionBundleAnalyzerAspect({
                customFunctionConstruct: LambdaFunction,
            })
        );
    }
}

/**
 * Staging ApplicationStage
 *
 * Adds an appropriate stage tag.
 */
export class StagingApplicationStage extends BaseApplicationStage {
    constructor(scope: Construct, props?: StageProps) {
        super(scope, BaseApplicationStage.DEFAULT_STAGES.staging, props);

        Tags.of(this).add('STAGE', BaseApplicationStage.DEFAULT_STAGES.staging);
    }
}

/**
 * Production ApplicationStage
 *
 * Adds an appropriate stage tag.
 * Constructs can apply production-specific configuration by checking for this stage
 *
 * @example
 * ```ts
 * const stage = Stage.of(scope);
 *
 * if (stage instanceof ProductionApplicationStage) {
 *     // Apply production-specific configuration
 * }
 * ```
 */
export class ProductionApplicationStage extends BaseApplicationStage {
    constructor(scope: Construct, props?: StageProps) {
        super(scope, BaseApplicationStage.DEFAULT_STAGES.production, props);

        Tags.of(this).add('STAGE', BaseApplicationStage.DEFAULT_STAGES.production);
    }
}
