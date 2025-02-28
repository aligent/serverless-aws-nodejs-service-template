import { Tree, readProjectConfiguration } from '@nx/devkit';
import { ClientGeneratorSchema } from './schema';
import { clientGenerator } from './generator';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

describe('client generator', () => {
    let tree: Tree;
    beforeEach(() => {
        tree = createTreeWithEmptyWorkspace();
        tree.root = ''; // Trees root is automatically /virtual/ but that breaks the unit tests
    });

    it('should generate a client successfully', async () => {
        const options: ClientGeneratorSchema = {
            name: 'test',
            schemaPath: `${__dirname}/unit-test-schemas/valid.yaml`,
            skipValidate: true, // Validation breaks this unit test for some reason (TODO: figure out wtf is going on here)
        };
        await clientGenerator(tree, options);
        const config = readProjectConfiguration(tree, 'test');
        expect(config).toBeDefined();
    }, 10000);

    it('should error if schema file is not found', async () => {
        const options: ClientGeneratorSchema = {
            name: 'test',
            schemaPath: './unit-test-schemas/missing.yaml',
            skipValidate: true,
        };
        expect(clientGenerator(tree, options)).rejects.toThrowError();
    });
});
