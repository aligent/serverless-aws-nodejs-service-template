#!/usr/bin/env node
import { App, Tags } from 'aws-cdk-lib';
import 'source-map-support/register';
import { ApplicationStage } from '../lib/application-stage';

const app = new App();

const staging = new ApplicationStage(app, 'stg', {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
    },
});

Tags.of(staging).add('STAGE', 'stg');

new ApplicationStage(app, 'prd', {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
    },
});

Tags.of(staging).add('STAGE', 'prd');
