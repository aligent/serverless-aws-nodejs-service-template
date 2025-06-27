import { addProjectConfiguration, formatFiles, generateFiles, Tree, updateJson } from '@nx/devkit';
import * as path from 'path';
import { ServiceGeneratorSchema } from './schema';

function getRootTsConfigPathInTree(tree: Tree): string {
    for (const path of ['tsconfig.base.json', 'tsconfig.json']) {
        if (tree.exists(path)) {
            return path;
        }
    }
    return 'tsconfig.base.json';
}

function addTsConfigPath(tree: Tree, importPath: string, lookupPaths: string[]) {
    updateJson(tree, getRootTsConfigPathInTree(tree), json => {
        json.compilerOptions ??= {};
        const c = json.compilerOptions;
        c.paths ??= {};

        if (c.paths[importPath]) {
            throw new Error(
                `You already have a library using the import path "${importPath}". Make sure to specify a unique one.`
            );
        }

        c.paths[importPath] = lookupPaths;

        return json;
    });
}

export async function serviceGenerator(tree: Tree, options: ServiceGeneratorSchema) {
    const projectRoot = `services/${options.name}`;

    addProjectConfiguration(tree, options.name, {
        root: projectRoot,
        projectType: 'library',
        sourceRoot: `${projectRoot}/src`,
        targets: {
            typecheck: {
                executor: 'nx:run-commands',
                options: {
                    cwd: '{projectRoot}',
                    color: true,
                    command: 'tsc --noEmit --pretty',
                },
            },
        },
        tags: ['service', options.type, options.name],
    });

    const templatePath =
        options.type === 'notification'
            ? path.join(__dirname, 'notification-files')
            : path.join(__dirname, 'general-files');

    generateFiles(tree, templatePath, projectRoot, {
        ...options,
        template: '',
    });

    // Add the service to tsconfig.base.json paths
    // The root application needs to import stacks from the service
    addTsConfigPath(tree, `@services/${options.name}`, [`${projectRoot}/src/index.ts`]);

    await formatFiles(tree);
}

export default serviceGenerator;
