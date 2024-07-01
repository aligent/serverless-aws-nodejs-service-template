import { Tree, readProjectConfiguration } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

import { serviceGenerator } from './generator';
import { serviceGeneratorSchema } from './schema';

describe('service generator', () => {
    let tree: Tree;
    beforeEach(() => {
        tree = createTreeWithEmptyWorkspace();
    });

    it('should run successfully when type is general', async () => {
        const options: serviceGeneratorSchema = {
            brand: 'test',
            name: 'test',
            type: 'general',
        };
        await serviceGenerator(tree, options);
        const config = readProjectConfiguration(tree, 'test');
        expect(config).toBeDefined();
        expect(config.tags).toEqual(['service', 'general', 'test']);
    });

    it('should run successfully when type is notification', async () => {
        const options: serviceGeneratorSchema = {
            brand: 'test',
            name: 'test',
            type: 'notification',
        };
        await serviceGenerator(tree, options);
        const config = readProjectConfiguration(tree, 'test');
        expect(config).toBeDefined();
        expect(config.tags).toEqual(['service', 'notification', 'test']);
    });
});
