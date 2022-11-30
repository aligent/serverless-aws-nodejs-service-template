// Step 1: import jest
import { jest } from '@jest/globals';

// Step 2: We only can mock the whole module & use experimental features if we have top-level await
jest.unstable_mockModule('../src/lib/aws/ssm', () => {
    return {
        getParametersByPath: jest.fn(() => [
            {
                Name: `${process.env.SSM_ROOT}/mocked/name1`,
                Value: 'mockedValue',
            },
            {
                Name: `${process.env.SSM_ROOT}/mocked/name2`,
                Value: 'm0ck3dS3cr3t',
            },
        ]),
    };
});

// Step 3: dynamically import modules
// We have to import our modules like this or Jest mock will fail
const { getParametersByPath } = await import('../src/lib/aws/ssm');
const { getConfigurations } = await import('../src/lib/collect-ssm-params');

afterEach(jest.clearAllMocks);

describe('getConfigurations', () => {
    it('returns the correct value when param names are correct', async () => {
        // Arrange
        const ssmPath = 'mocked';
        const paramNames = ['name1', 'name2'] as const;

        // Act
        const result = await getConfigurations<typeof paramNames[number]>(
            ssmPath,
            paramNames
        );

        // Assert
        expect(getParametersByPath).toBeCalledTimes(1);
        expect(result).toEqual({
            name1: 'mockedValue',
            name2: 'm0ck3dS3cr3t',
        });
    });

    it.todo(
        'throws the correct error when when one of the param names is incorrect'
    );
});
