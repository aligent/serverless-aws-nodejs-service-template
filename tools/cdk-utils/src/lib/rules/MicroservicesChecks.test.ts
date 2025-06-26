import { describe, expect, it } from 'vitest';
import { MicroservicesChecks } from './MicroservicesChecks';

describe('MicroservicesChecks', () => {
    it('should have the correct pack name', () => {
        // Arrange
        const checks = new MicroservicesChecks();

        // Assert
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((checks as any).packName).toBe('Microservices');
    });

    it('should instantiate with props', () => {
        // Arrange & Act
        const checks = new MicroservicesChecks({ verbose: true });

        // Assert
        expect(checks).toBeInstanceOf(MicroservicesChecks);
    });

    it('should instantiate without props', () => {
        // Arrange & Act
        const checks = new MicroservicesChecks();

        // Assert
        expect(checks).toBeInstanceOf(MicroservicesChecks);
    });

    it('should have a visit method', () => {
        // Arrange
        const checks = new MicroservicesChecks();

        // Assert
        expect(typeof checks.visit).toBe('function');
    });
});
