import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { pickFromProcessEnv } from './pickFromProcessEnv';

describe('pickFromProcessEnv', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        // Create a clean environment for each test
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        // Restore original environment
        process.env = originalEnv;
    });

    it('should return object and values array when all environment variables are set', () => {
        process.env.TEST_VAR1 = 'value1';
        process.env.TEST_VAR2 = 'value2';
        process.env.TEST_VAR3 = 'value3';

        const result = pickFromProcessEnv('TEST_VAR1', 'TEST_VAR2', 'TEST_VAR3');

        expect(result.object).toEqual({
            TEST_VAR1: 'value1',
            TEST_VAR2: 'value2',
            TEST_VAR3: 'value3',
        });
        expect(result.values).toEqual(['value1', 'value2', 'value3']);
    });

    it('should handle a single environment variable', () => {
        process.env.SINGLE_VAR = 'single_value';

        const result = pickFromProcessEnv('SINGLE_VAR');

        expect(result.object).toEqual({
            SINGLE_VAR: 'single_value',
        });
        expect(result.values).toEqual(['single_value']);
    });

    it('should throw an error when one environment variable is not set', () => {
        process.env.TEST_VAR1 = 'value1';
        process.env.TEST_VAR3 = 'value3';
        // TEST_VAR2 is not set

        expect(() => {
            pickFromProcessEnv('TEST_VAR1', 'TEST_VAR2', 'TEST_VAR3');
        }).toThrow('Environment variable TEST_VAR2 is not set');
    });

    it('should throw an error with all missing variables listed', () => {
        process.env.TEST_VAR2 = 'value2';
        // TEST_VAR1 and TEST_VAR3 are not set

        expect(() => {
            pickFromProcessEnv('TEST_VAR1', 'TEST_VAR2', 'TEST_VAR3');
        }).toThrow(
            'Environment variable TEST_VAR1 is not set\nEnvironment variable TEST_VAR3 is not set'
        );
    });

    it('should throw an error when all environment variables are not set', () => {
        // None of the variables are set

        expect(() => {
            pickFromProcessEnv('MISSING_VAR1', 'MISSING_VAR2');
        }).toThrow(
            'Environment variable MISSING_VAR1 is not set\nEnvironment variable MISSING_VAR2 is not set'
        );
    });

    it('should treat falsey values as missing', () => {
        process.env.EMPTY_VAR = '';
        process.env.NORMAL_VAR = 'normal';

        expect(() => pickFromProcessEnv('EMPTY_VAR', 'NORMAL_VAR')).toThrow(
            'Environment variable EMPTY_VAR is not set'
        );
    });

    it('should return frozen objects', () => {
        process.env.TEST_VAR = 'value';

        const result = pickFromProcessEnv('TEST_VAR');

        expect(Object.isFrozen(result.object)).toBe(true);
        expect(Object.isFrozen(result.values)).toBe(true);
    });

    it('should preserve the order of values in the array', () => {
        process.env.THIRD = '3';
        process.env.FIRST = '1';
        process.env.SECOND = '2';

        const result = pickFromProcessEnv('FIRST', 'SECOND', 'THIRD');

        // Object order doesn't matter, but array order should match input order
        expect(result.values).toEqual(['1', '2', '3']);
    });

    it('should handle special characters in environment variable values', () => {
        process.env.SPECIAL_VAR = 'value with spaces & special chars $%^';
        process.env.JSON_VAR = '{"key": "value"}';

        const result = pickFromProcessEnv('SPECIAL_VAR', 'JSON_VAR');

        expect(result.object).toEqual({
            SPECIAL_VAR: 'value with spaces & special chars $%^',
            JSON_VAR: '{"key": "value"}',
        });
        expect(result.values).toEqual([
            'value with spaces & special chars $%^',
            '{"key": "value"}',
        ]);
    });
});
