import { describe, expect, it } from 'vitest';
import { StepFunctionFromFile } from './step-function-from-file';

describe('StepFunctionFromFile', () => {
    it('should have the correct static context key', () => {
        expect(StepFunctionFromFile.CONTEXT_KEY).toBe('@aligent.cdk-utils.StepFunctionFromFile');
    });

    it('should define context correctly', () => {
        // Arrange & Act
        const context = StepFunctionFromFile.defineContext({
            tracingEnabled: true,
            stateMachineName: 'TestMachine',
        });

        // Assert
        expect(context).toEqual({
            [StepFunctionFromFile.CONTEXT_KEY]: {
                tracingEnabled: true,
                stateMachineName: 'TestMachine',
            },
        });
    });

    it('should have correct property injection ID', () => {
        // Arrange
        const mockStepFunction = Object.create(StepFunctionFromFile.prototype);
        mockStepFunction.PROPERTY_INJECTION_ID = '@aligent.cdk-utils.StepFunctionFromFile';

        // Assert
        expect(mockStepFunction.PROPERTY_INJECTION_ID).toBe(
            '@aligent.cdk-utils.StepFunctionFromFile'
        );
    });
});
