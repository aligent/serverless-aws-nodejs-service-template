import { addProjectConfiguration, formatFiles, generateFiles, Tree } from '@nx/devkit';
import * as path from 'path';
import { CdkServiceGeneratorSchema } from './schema';

export default async function (tree: Tree, options: CdkServiceGeneratorSchema) {
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
        packageName: `@${options.brand}-int/integrations`,
    });

    await formatFiles(tree);
}
