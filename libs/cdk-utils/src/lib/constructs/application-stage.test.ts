import { Aspects, Stack } from 'aws-cdk-lib';
import { beforeEach, describe, expect, it } from 'vitest';
import { FunctionBundleAnalyzerAspect } from '../aspects/function-bundle-analyzer';
import {
    CustomApplicationStage,
    DevelopmentApplicationStage,
    ProductionApplicationStage,
    StagingApplicationStage,
} from './application-stage';

describe('CustomApplicationStage', () => {
    it('should throw an error if the stage is a default stage', () => {
        expect(() => new CustomApplicationStage(new Stack(), 'prd')).toThrow();
        expect(() => new CustomApplicationStage(new Stack(), 'stg')).toThrow();
        expect(() => new CustomApplicationStage(new Stack(), 'dev')).toThrow();
    });
});

describe('DevelopmentApplicationStage', () => {
    let stage: DevelopmentApplicationStage;
    beforeEach(() => {
        const stack = new Stack();
        stage = new DevelopmentApplicationStage(stack);
    });

    it('should create a development stage', () => {
        expect(stage.stageName).toBe('dev');
    });

    it('should include the FunctionBundleAnalyzerAspect', () => {
        const aspect = Aspects.of(stage).all.find(
            aspect => aspect instanceof FunctionBundleAnalyzerAspect
        );
        expect(aspect).toBeDefined();
    });
});

describe('StagingApplicationStage', () => {
    let stage: StagingApplicationStage;
    beforeEach(() => {
        const stack = new Stack();
        stage = new StagingApplicationStage(stack);
    });

    it('should create a staging stage', () => {
        expect(stage.stageName).toBe('stg');
    });
});

describe('ProductionApplicationStage', () => {
    let stage: ProductionApplicationStage;
    beforeEach(() => {
        const stack = new Stack();
        stage = new ProductionApplicationStage(stack);
    });

    it('should create a production stage', () => {
        expect(stage.stageName).toBe('prd');
    });
});
