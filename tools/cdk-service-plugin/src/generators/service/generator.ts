import { formatFiles, generateFiles, Tree, updateJson } from '@nx/devkit';
import * as path from 'path';
import { ServiceGeneratorSchema } from './schema';

function addTsConfigReference(tree: Tree, referencePath: string) {
    updateJson(tree, 'tsconfig.json', json => {
        json.references ??= [];

        if (json.references.some((r: { path: string }) => r.path === referencePath)) {
            throw new Error(
                `You already have a library using the import path "${referencePath}". Make sure to specify a unique one.`
            );
        }

        json.references.push({
            path: referencePath,
        });

        return json;
    });
}

function registerWithTypecheckPlugin(tree: Tree, referencePath: string) {
    updateJson(tree, 'nx.json', json => {
        json.plugins ??= [];

        // Services should be non-buildable, so we need to register them with the typescript plugin configuration
        // that adds typechecking but not a build argument
        const plugin = json.plugins.find(
            (p: {
                plugin: string;
                include: string[];
                options?: { typecheck?: unknown; build?: unknown };
            }) => p.plugin === '@nx/js/typescript' && p.options?.typecheck && !p.options?.build
        );

        if (!plugin) {
            json.plugins.push({
                plugin: '@nx/js/typescript',
                options: {
                    typecheck: {
                        targetName: 'typecheck',
                    },
                },
                include: [referencePath],
            });
        } else {
            plugin.include.push(referencePath);
        }

        return json;
    });
}

export async function serviceGenerator(tree: Tree, options: ServiceGeneratorSchema) {
    const projectRoot = `services/${options.name}`;

    const templatePath =
        options.type === 'notification'
            ? path.join(__dirname, 'notification-files')
            : path.join(__dirname, 'general-files');

    generateFiles(tree, templatePath, projectRoot, {
        ...options,
        template: '',
    });

    // Add the service to tsconfig.json references and nx.json plugins
    // The root application needs to import stacks from the service
    addTsConfigReference(tree, `./${projectRoot}`);
    registerWithTypecheckPlugin(tree, `${projectRoot}/*`);

    await formatFiles(tree);
}

export default serviceGenerator;
