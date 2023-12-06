import { serverlessPlugin } from './serverless-plugin';

describe('serverlessPlugin', () => {
    it('should work', () => {
        expect(serverlessPlugin()).toEqual('serverless-plugin');
    });
});
