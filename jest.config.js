module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    globals: {
        'ts-jest': {
            isolatedModules: true,
        },
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
