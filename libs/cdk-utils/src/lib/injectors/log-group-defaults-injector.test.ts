import { PropertyInjectors, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { LogGroupDefaultsInjector } from './log-group-defaults-injector';

describe('LogGroupDefaultsInjector', () => {
    let stack: Stack;

    beforeEach(() => {
        stack = new Stack();
        PropertyInjectors.of(stack).add(new LogGroupDefaultsInjector());
    });

    it('applies production defaults to log groups', () => {
        new LogGroup(stack, 'TestLogGroup');

        const template = Template.fromStack(stack);

        template.hasResourceProperties('AWS::Logs::LogGroup', {
            RetentionInDays: RetentionDays.TWO_YEARS,
        });
    });

    it('applies development configuration when specified', () => {
        const devStack = new Stack();
        PropertyInjectors.of(devStack).add(new LogGroupDefaultsInjector('dev'));

        new LogGroup(devStack, 'DevLogGroup');

        const template = Template.fromStack(devStack);

        template.hasResourceProperties('AWS::Logs::LogGroup', {
            RetentionInDays: RetentionDays.ONE_WEEK,
        });
    });

    it('applies staging configuration when specified', () => {
        const stagingStack = new Stack();
        PropertyInjectors.of(stagingStack).add(new LogGroupDefaultsInjector('stg'));

        new LogGroup(stagingStack, 'StagingLogGroup');

        const template = Template.fromStack(stagingStack);

        template.hasResourceProperties('AWS::Logs::LogGroup', {
            RetentionInDays: RetentionDays.SIX_MONTHS,
        });
    });
});
