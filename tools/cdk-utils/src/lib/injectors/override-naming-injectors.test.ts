/* eslint-disable @typescript-eslint/no-explicit-any */
import { App, Stack } from 'aws-cdk-lib';
import { Function } from 'aws-cdk-lib/aws-lambda';
import { StateMachine } from 'aws-cdk-lib/aws-stepfunctions';
import { describe, expect, it, vi } from 'vitest';
import {
    OverrideFunctionNameInjector,
    OverrideStateMachineNameInjector,
} from './override-naming-injectors';

describe('OverrideFunctionNameInjector', () => {
    it('should have the correct construct unique ID', () => {
        // Arrange
        const formatName = vi.fn();
        const injector = new OverrideFunctionNameInjector(formatName);

        // Assert
        expect(injector.constructUniqueId).toBe(Function.PROPERTY_INJECTION_ID);
    });

    it('should inject formatted function name', () => {
        // Arrange
        const formatName = vi.fn((id: string) => `formatted-${id}`);
        const injector = new OverrideFunctionNameInjector(formatName);
        const originalProps = {
            runtime: 'nodejs20.x',
            handler: 'index.handler',
        };
        const context = {
            id: 'MyFunction',
            stack: new Stack(new App(), 'TestStack'),
        };

        // Act
        const result = injector.inject(originalProps as any, context as any);

        // Assert
        expect(formatName).toHaveBeenCalledWith('MyFunction');
        expect(result).toEqual({
            ...originalProps,
            functionName: 'formatted-MyFunction',
        });
    });

    it('should preserve original properties', () => {
        // Arrange
        const formatName = vi.fn(() => 'custom-name');
        const injector = new OverrideFunctionNameInjector(formatName);
        const originalProps = {
            runtime: 'nodejs20.x',
            handler: 'index.handler',
            memorySize: 256,
            timeout: 30,
        };
        const context = {
            id: 'MyFunction',
            stack: new Stack(new App(), 'TestStack'),
        };

        // Act
        const result = injector.inject(originalProps as any, context as any);

        // Assert
        expect(result).toEqual({
            ...originalProps,
            functionName: 'custom-name',
        });
    });
});

describe('OverrideStateMachineNameInjector', () => {
    it('should have the correct construct unique ID', () => {
        // Arrange
        const formatName = vi.fn();
        const injector = new OverrideStateMachineNameInjector(formatName);

        // Assert
        expect(injector.constructUniqueId).toBe(StateMachine.PROPERTY_INJECTION_ID);
    });

    it('should inject formatted state machine name', () => {
        // Arrange
        const formatName = vi.fn((id: string) => `formatted-${id}`);
        const injector = new OverrideStateMachineNameInjector(formatName);
        const originalProps = {
            definitionBody: { bind: () => ({ value: '{}' }) },
        };
        const context = {
            id: 'MyStateMachine',
            stack: new Stack(new App(), 'TestStack'),
        };

        // Act
        const result = injector.inject(originalProps as any, context as any);

        // Assert
        expect(formatName).toHaveBeenCalledWith('MyStateMachine');
        expect(result).toEqual({
            ...originalProps,
            stateMachineName: 'formatted-MyStateMachine',
        });
    });

    it('should preserve original properties', () => {
        // Arrange
        const formatName = vi.fn(() => 'custom-name');
        const injector = new OverrideStateMachineNameInjector(formatName);
        const originalProps = {
            definitionBody: { bind: () => ({ value: '{}' }) },
            tracingEnabled: true,
            timeout: 60,
        };
        const context = {
            id: 'MyStateMachine',
            stack: new Stack(new App(), 'TestStack'),
        };

        // Act
        const result = injector.inject(originalProps as any, context as any);

        // Assert
        expect(result).toEqual({
            ...originalProps,
            stateMachineName: 'custom-name',
        });
    });
});
