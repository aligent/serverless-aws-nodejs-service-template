#!/usr/bin/env node
import { App, Aspects } from 'aws-cdk-lib';
import { AwsSolutionsChecks, ServerlessChecks } from 'cdk-nag';
import 'source-map-support/register';
import { APPLICATION_CONTEXT } from '../lib/application-context';
import { ApplicationStage } from '../lib/application-stage';

const app = new App({
    context: APPLICATION_CONTEXT,
});

new ApplicationStage(app, 'stg', {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
    },
});

new ApplicationStage(app, 'prd', {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
    },
});

Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true, reports: true }));
Aspects.of(app).add(new ServerlessChecks({ verbose: true, reports: true }));
