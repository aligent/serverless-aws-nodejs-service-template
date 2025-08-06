#!/usr/bin/env node
import { App, Tags } from 'aws-cdk-lib';
import { APPLICATION_CONTEXT } from '../lib/application-context';
import { Development, Production, Staging } from '../lib/application-stages';

const app = new App({
    context: APPLICATION_CONTEXT,
});

new Development(app);

new Staging(app);

new Production(app);

Tags.of(app).add('OWNER', APPLICATION_CONTEXT.APPLICATION_OWNER);
