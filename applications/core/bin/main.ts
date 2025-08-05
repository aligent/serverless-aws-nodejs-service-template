#!/usr/bin/env node
import { type } from 'arktype';
import { App, Tags } from 'aws-cdk-lib';
import { APPLICATION_CONTEXT } from '../lib/application-context';
import { Development, Production, Staging } from '../lib/application-stages';

const { CDK_DEFAULT_ACCOUNT, CDK_DEFAULT_REGION } = type({
    CDK_DEFAULT_ACCOUNT: 'string',
    CDK_DEFAULT_REGION: 'string',
})
    .describe(
        'correct AWS account and region to deploy to. Check your profile and credentials configuration'
    )
    .assert(process.env);

const app = new App({
    context: APPLICATION_CONTEXT,
});

new Development(app, {
    env: {
        account: CDK_DEFAULT_ACCOUNT,
        region: CDK_DEFAULT_REGION,
    },
});

new Staging(app, {
    env: {
        account: CDK_DEFAULT_ACCOUNT,
        region: CDK_DEFAULT_REGION,
    },
});

new Production(app, {
    env: {
        account: CDK_DEFAULT_ACCOUNT,
        region: CDK_DEFAULT_REGION,
    },
});

Tags.of(app).add('OWNER', APPLICATION_CONTEXT.APPLICATION_OWNER);
