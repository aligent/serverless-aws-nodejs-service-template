import { describe, expect, it } from 'vitest';
import { MicroserviceChecks } from './MicroserviceChecks';

describe('MicroserviceChecks', () => {
    it('should have the correct pack name', () => {
        // Arrange
        const checks = new MicroserviceChecks();

        // Assert
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((checks as any).packName).toBe('Microservices');
    });

    it('should instantiate with props', () => {
        // Arrange & Act
        const checks = new MicroserviceChecks({ verbose: true });

        // Assert
        expect(checks).toBeInstanceOf(MicroserviceChecks);
    });

    it('should instantiate without props', () => {
        // Arrange & Act
        const checks = new MicroserviceChecks();

        // Assert
        expect(checks).toBeInstanceOf(MicroserviceChecks);
    });

    it('should have a visit method', () => {
        // Arrange
        const checks = new MicroserviceChecks();

        // Assert
        expect(typeof checks.visit).toBe('function');
    });
});
