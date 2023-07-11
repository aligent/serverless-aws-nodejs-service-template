module.exports = {
    testEnvironment: 'node',
    setupFiles: ['./tests/__config__/jest-env.js'],
    transform: {
        '^.+\\.m?[t]sx?$': [
            'ts-jest',
            {
                isolatedModules: true,
            },
        ],
    },
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80,
        },
    },
};
