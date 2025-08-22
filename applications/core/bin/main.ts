#!/usr/bin/env node
import {
    LogGroupDefaultsInjector,
    NodeJsFunctionDefaultsInjector,
    StepFunctionDefaultsInjector,
    VersionFunctionsAspect,
} from '@libs/cdk-utils/infra';
import { TestAppStack } from '@services/test-app';
import { App, Aspects, Duration, Stage, Tags, type StageProps } from 'aws-cdk-lib';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import type { Construct } from 'constructs';
import { APPLICATION_CONTEXT } from '../lib/application-context';

const app = new App({
    context: APPLICATION_CONTEXT,
    propertyInjectors: [
        new LogGroupDefaultsInjector(),
        // Apply properties to the entire application
        // NOTE: Aspects do not work here because the Stage construct doesn't pass them through
        new NodeJsFunctionDefaultsInjector().withProps({
            timeout: Duration.seconds(6),
            memorySize: 192,
            runtime: Runtime.NODEJS_22_X,
            architecture: Architecture.ARM_64,
        }),
        new StepFunctionDefaultsInjector(),
    ],
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

        // Instantiate service stacks here as required
        new TestAppStack(this, 'TestAppStack');
    }
}

// Set up application stages
new ApplicationStage(app, 'dev', {
    propertyInjectors: [
        // NOTE: Property Injectors will only apply ONCE each, so adding one here
        // overrides the same injector at the app level
        new NodeJsFunctionDefaultsInjector({ sourceMap: false }).withProps({
            timeout: Duration.seconds(6),
            memorySize: 192,
            runtime: Runtime.NODEJS_22_X,
            architecture: Architecture.ARM_64,
        }),
        new LogGroupDefaultsInjector({ duration: 'SHORT' }),
    ],
});

new ApplicationStage(app, 'stg', {
    propertyInjectors: [new LogGroupDefaultsInjector({ duration: 'MEDIUM' })],
});

const prd = new ApplicationStage(app, 'prd');
// Ensure lambdas and step functions are versioned and have the default alias
Aspects.of(prd).add(new VersionFunctionsAspect());
