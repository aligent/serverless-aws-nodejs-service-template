import { Tree, addProjectConfiguration, formatFiles, generateFiles } from '@nx/devkit';
import path from 'path';
import { serviceGeneratorSchema } from './schema';

const buildRunCommandConfig = (command: string, dir = '{projectRoot}') => ({
    executor: 'nx:run-commands',
    options: {
        cwd: dir,
        color: true,
        command: command,
    },
});

const getTemplateFilesLocation = (type: serviceGeneratorSchema['type'] = 'general') => {
    if (type === 'notification') {
        return path.join(__dirname, 'notification-files');
    }

    return path.join(__dirname, 'general-files');
};

export async function serviceGenerator(tree: Tree, options: serviceGeneratorSchema) {
    const { name, type } = options;
    const projectRoot = `services/${name}`;

    addProjectConfiguration(tree, name, {
        root: projectRoot,
        projectType: 'application',
        sourceRoot: `${projectRoot}/src`,
        targets: {
            build: {
                ...buildRunCommandConfig('sls package'),
            },
            deploy: {
                ...buildRunCommandConfig('sls deploy'),
            },
            remove: {
                ...buildRunCommandConfig('sls remove'),
            },
        },
        tags: ['service', type, name],
    });

    const templateFilesLocation = getTemplateFilesLocation(type);

    generateFiles(tree, templateFilesLocation, projectRoot, options);
    await formatFiles(tree);
}

export default serviceGenerator;
