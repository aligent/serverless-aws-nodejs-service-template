import { PropertyInjectors, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import path from 'node:path';
import { NodeJsFunctionDefaultsInjector } from './nodejs-function-defaults-injector';

describe('NodeJsFunctionDefaultsInjector', () => {
    let stack: Stack;

    beforeEach(() => {
        stack = new Stack();
    });

    it('Should set the NodeJs runtime', () => {
        PropertyInjectors.of(stack).add(new NodeJsFunctionDefaultsInjector());

        new NodejsFunction(stack, 'MyFunction', {
            entry: path.join(__dirname, '__data__', 'test-handler.ts'),
        });

        const template = Template.fromStack(stack);
        template.hasResourceProperties('AWS::Lambda::Function', {
            Runtime: Runtime.NODEJS_22_X.name,
        });
    });

    it('Should default to production configuration', () => {
        PropertyInjectors.of(stack).add(new NodeJsFunctionDefaultsInjector());

        new NodejsFunction(stack, 'MyFunction', {
            entry: path.join(__dirname, '__data__', 'test-handler.ts'),
        });

        const template = Template.fromStack(stack);
        template.hasResourceProperties('AWS::Lambda::Function', {
            Environment: {
                Variables: {
                    NODE_OPTIONS: '--enable-source-maps',
                },
            },
        });
    });

    it('Should add additional properties', () => {
        PropertyInjectors.of(stack).add(
            new NodeJsFunctionDefaultsInjector().withProps({
                memorySize: 1024,
            })
        );

        new NodejsFunction(stack, 'MyFunction', {
            entry: path.join(__dirname, '__data__', 'test-handler.ts'),
        });

        const template = Template.fromStack(stack);
        template.hasResourceProperties('AWS::Lambda::Function', {
            MemorySize: 1024,
        });
    });

    test('merges bundling and environment properties correctly', () => {
        PropertyInjectors.of(stack).add(
            new NodeJsFunctionDefaultsInjector({
                sourceMap: false,
                esm: true,
                minify: false,
            })
        );

        new NodejsFunction(stack, 'MyFunction', {
            entry: path.join(__dirname, '__data__', 'test-handler.ts'),
            bundling: {
                // Sourcemaps would normally be false in 'dev' configuration
                sourceMap: true,
            },
            environment: {
                BUCKET_NAME: 'test-bucket',
            },
        });

        const template = Template.fromStack(stack);

        // Check that NODE_OPTIONS is set due to sourceMap: true from context
        template.hasResourceProperties('AWS::Lambda::Function', {
            Environment: {
                Variables: {
                    BUCKET_NAME: 'test-bucket',
                    NODE_OPTIONS: '--enable-source-maps',
                },
            },
        });
    });
});
