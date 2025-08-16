#!/usr/bin/env node
import {
    LogGroupDefaultsInjector,
    NodeJsFunctionDefaultsInjector,
    StepFunctionDefaultsInjector,
    VersionResourcesAspect,
} from '@libs/cdk-utils';
import {
    App,
    Aspects,
    Duration,
    PropertyInjectors,
    Stage,
    Tags,
    type StageProps,
} from 'aws-cdk-lib';
import { Architecture, Runtime, Tracing } from 'aws-cdk-lib/aws-lambda';
import type { Construct } from 'constructs';
import { APPLICATION_CONTEXT } from '../lib/application-context';

const app = new App({
    context: APPLICATION_CONTEXT,
});
Tags.of(app).add('OWNER', APPLICATION_CONTEXT.APPLICATION_OWNER);

/**
 * Application stage
 *
 * This is the main entry point for the application.
 * It is used to define context and compose service stacks.
 */
class ApplicationStage extends Stage {
    constructor(scope: Construct, id: string, props?: StageProps) {
        super(scope, id, props);

        Tags.of(this).add('STAGE', id);

        // Set up stage-specific defaults via aspects and property injection
        Aspects.of(app).add(new VersionResourcesAspect());

        PropertyInjectors.of(this).add(
            new NodeJsFunctionDefaultsInjector(id).withProps({
                timeout: Duration.seconds(6),
                memorySize: 192,
                runtime: Runtime.NODEJS_22_X,
                tracing: Tracing.ACTIVE,
                architecture: Architecture.ARM_64,
            }),
            new StepFunctionDefaultsInjector(id),
            new LogGroupDefaultsInjector(id)
        );

        // Instantiate service stacks here as required
    }
}

// Set up application stages
new ApplicationStage(app, 'dev');

new ApplicationStage(app, 'stg');

new ApplicationStage(app, 'prd');
