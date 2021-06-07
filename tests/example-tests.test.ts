import { simpleObject } from "./__data__/example-data";

describe('Passing and failing tests', () => {
    test('Passing test', () => {
        expect(1).toBeTruthy();
    });

    test('Failing test', () => {
        expect(0).toBeTruthy();
    });
});

describe('Simple object tests', () => {
    test('Object has correct name', () => {
        expect(simpleObject.name).toEqual('Test Object');
    });
})