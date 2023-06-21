import { simpleObject } from './__data__/example-data';

const YOUR_ENV_VAR = process.env.YOUR_ENV_VAR;

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

describe('Env config tests', () => {
    test('Env config is set correctly', () => {
        expect(YOUR_ENV_VAR).toEqual('environment-variable');
    });
});
