import type { InjectionContext, IPropertyInjector } from 'aws-cdk-lib';
import { Function, type FunctionProps } from 'aws-cdk-lib/aws-lambda';
import { StateMachine, type StateMachineProps } from 'aws-cdk-lib/aws-stepfunctions';

export class OverrideFunctionNameInjector implements IPropertyInjector {
    public readonly constructUniqueId = Function.PROPERTY_INJECTION_ID;

    constructor(private readonly formatName: (id: string) => string) {}

    public inject(originalProps: FunctionProps, context: InjectionContext) {
        return {
            ...originalProps,
            functionName: this.formatName(context.id),
        };
    }
}

export class OverrideStateMachineNameInjector implements IPropertyInjector {
    public readonly constructUniqueId = StateMachine.PROPERTY_INJECTION_ID;

    constructor(private readonly formatName: (id: string) => string) {}

    public inject(originalProps: StateMachineProps, context: InjectionContext) {
        return {
            ...originalProps,
            stateMachineName: this.formatName(context.id),
        };
    }
}
