import { simpleObject } from './__data__/example-data';

describe('Function name', () => {
    test('Passes example test when result is truthy', () => {
        const result = 1;
        expect(result).toBeTruthy();
    });

    test.skip('Skipped/Failed example test when result is less than 0', () => {
        const result = -1;
        expect(result).toBeGreaterThan(0);
    });
});

describe('Simple object tests', () => {
    test('Object has correct name', () => {
        expect(simpleObject.name).toEqual('Test Object');
    });
});
