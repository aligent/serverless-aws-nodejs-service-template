import { simpleObject } from './__data__/example-data';

describe('Passing tests', () => {
    test('Passing test', () => {
        expect(1).toBeTruthy();
    });

    test.skip('Skipped/Failing test', () => {
        expect(-1).toBeGreaterThan(0);
    });
});

describe('Simple object tests', () => {
    test('Object has correct name', () => {
        expect(simpleObject.name).toEqual('Test Object');
    });
});
