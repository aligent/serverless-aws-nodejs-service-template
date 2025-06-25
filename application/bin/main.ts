#!/usr/bin/env node
import { App, Duration } from 'aws-cdk-lib';
import { Runtime, Tracing } from 'aws-cdk-lib/aws-lambda';
import 'source-map-support/register';
import { ApplicationStage } from '../lib/application-stage';

const app = new App({});

app.node.setContext('lambda', {
    timeout: Duration.seconds(6),
    memorySize: 192,
    runtime: Runtime.NODEJS_20_X,
    tracing: Tracing.ACTIVE,
    environment: {
        NODE_OPTIONS: '--enable-source-maps',
    },
    bundling: {
        sourceMap: true,
    },
    alias: 'LATEST',
});

app.node.setContext('step-function', {
    tracingEnabled: true,
    alias: 'LATEST',
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
