import { describe, expect, it } from 'vitest';
import { LambdaFunction } from './lambda-function';

describe('LambdaFunction', () => {
    it('should have the correct static context key', () => {
        expect(LambdaFunction.CONTEXT_KEY).toBe('@aligent.cdk-utils.LambdaFunction');
    });

    it('should define context correctly', () => {
        // Arrange & Act
        const context = LambdaFunction.defineContext({
            memorySize: 256,
        });

        // Assert
        expect(context).toEqual({
            [LambdaFunction.CONTEXT_KEY]: {
                memorySize: 256,
            },
        });
    });

    it('should have correct property injection ID', () => {
        // Arrange
        const mockLambdaFunction = Object.create(LambdaFunction.prototype);
        mockLambdaFunction.PROPERTY_INJECTION_ID = '@aligent.cdk-utils.LambdaFunction';

        // Assert
        expect(mockLambdaFunction.PROPERTY_INJECTION_ID).toBe('@aligent.cdk-utils.LambdaFunction');
    });
});
