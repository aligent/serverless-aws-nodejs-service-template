import {
    addProjectConfiguration,
    formatFiles,
    generateFiles,
    Tree,
} from '@nx/devkit';
import * as path from 'path';
import { serviceGeneratorSchema } from './schema';

const buildRunCommandConfig = (dir: string, command: string) => ({
    executor: 'nx:run-commands',
    options: {
        cwd: dir,
        color: true,
        command: command,
    },
});

export async function serviceGenerator(
    tree: Tree,
    options: serviceGeneratorSchema
) {
    const projectRoot = `services/${options.name}`;
    addProjectConfiguration(tree, options.name, {
        root: projectRoot,
        projectType: 'application',
        sourceRoot: `${projectRoot}/src`,
        targets: {
            build: {
                ...buildRunCommandConfig(projectRoot, 'sls package'),
            },
            deploy: {
                ...buildRunCommandConfig(projectRoot, 'sls deploy'),
            },
            remove: {
                ...buildRunCommandConfig(projectRoot, 'sls remove'),
            },
            'check-types': {
                'executor': 'nx:run-commands',
                'options': {
                    'cwd': '{projectRoot}',
                    'color': true,
                    'command': 'tsc --noEmit --pretty'
                }
            },
            lint: {
                executor: '@nx/linter:eslint',
                outputs: ['{options.outputFile}'],
                options: {
                    lintFilePatterns: [projectRoot + '/**/*.ts'],
                    maxWarnings: 0,
                },
            },
            test: {
                executor: '@nx/vite:test',
                outputs: ['{options.reportsDirectory}'],
                options: {
                    passWithNoTests: true,
                    reportsDirectory: `../../coverage/${projectRoot}`,
                },
            },
        },
    });
    generateFiles(tree, path.join(__dirname, 'files'), projectRoot, options);
    await formatFiles(tree);
}

export default serviceGenerator;
