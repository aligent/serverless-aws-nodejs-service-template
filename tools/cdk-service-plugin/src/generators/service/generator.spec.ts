import { Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

import { serviceGenerator } from './generator';
import { ServiceGeneratorSchema } from './schema';

describe('service generator', () => {
    let tree: Tree;
    beforeEach(() => {
        tree = createTreeWithEmptyWorkspace();
        tree.write(
            'tsconfig.json',
            `{
                "extends": "./tsconfig.base.json",
                "compileOnSave": false,
                "files": [],
                "references": []
            }`
        );
    });

    it('should run successfully when type is general', async () => {
        const options: ServiceGeneratorSchema = {
            name: 'test',
            type: 'general',
        };

        await expect(serviceGenerator(tree, options)).resolves.not.toThrow();
    });

    it('should run successfully when type is notification', async () => {
        const options: ServiceGeneratorSchema = {
            name: 'test',
            type: 'notification',
        };
        await expect(serviceGenerator(tree, options)).resolves.not.toThrow();
    });

    it('should add the project reference to tsconfig.json', async () => {
        const options: ServiceGeneratorSchema = {
            name: 'test',
            type: 'general',
        };

        await serviceGenerator(tree, options);

        const tsconfig = tree.read('tsconfig.json', 'utf-8');

        assert.isNotNull(tsconfig);

        const references = JSON.parse(tsconfig).references;

        expect(references).toEqual([{ path: './services/test' }]);
    });

    it('should register the services as a no-buildable typecheck target', async () => {
        const options: ServiceGeneratorSchema = {
            name: 'test',
            type: 'general',
        };

        await serviceGenerator(tree, options);

        const nxjson = tree.read('nx.json', 'utf-8');

        assert.isNotNull(nxjson);

        const plugins = JSON.parse(nxjson).plugins;

        expect(plugins).toEqual([
            {
                plugin: '@nx/js/typescript',
                options: {
                    typecheck: {
                        targetName: 'typecheck',
                    },
                },
                include: ['services/test/*'],
            },
        ]);
    });

    it('should not add paths to the base tsconfig', async () => {
        const options: ServiceGeneratorSchema = {
            name: 'test',
            type: 'general',
        };

        await serviceGenerator(tree, options);

        const tsconfig = tree.read('tsconfig.base.json', 'utf-8');

        assert.isNotNull(tsconfig);

        const paths = JSON.parse(tsconfig).paths;

        expect(paths).toBe(undefined);
    });
});
