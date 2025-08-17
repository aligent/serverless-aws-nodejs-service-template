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

    it('applies long duration defaults to log groups', () => {
        new LogGroup(stack, 'TestLogGroup');

        const template = Template.fromStack(stack);

        template.hasResourceProperties('AWS::Logs::LogGroup', {
            RetentionInDays: RetentionDays.TWO_YEARS,
        });
    });

    it('applies short duration configuration when specified', () => {
        PropertyInjectors.of(stack).add(new LogGroupDefaultsInjector({ duration: 'SHORT' }));

        new LogGroup(stack, 'ShortLogGroup');

        const template = Template.fromStack(stack);

        template.hasResourceProperties('AWS::Logs::LogGroup', {
            RetentionInDays: RetentionDays.ONE_WEEK,
        });
    });

    it('applies medium duration configuration when specified', () => {
        PropertyInjectors.of(stack).add(new LogGroupDefaultsInjector({ duration: 'MEDIUM' }));

        new LogGroup(stack, 'MediumLogGroup');

        const template = Template.fromStack(stack);

        template.hasResourceProperties('AWS::Logs::LogGroup', {
            RetentionInDays: RetentionDays.SIX_MONTHS,
        });
    });
});
