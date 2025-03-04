import {
    Tree,
    addProjectConfiguration,
    formatFiles,
    generateFiles,
    joinPathFragments,
    updateJson,
} from '@nx/devkit';
import { prompt } from 'enquirer';
import {
    copySchema,
    generateOpenApiTypes,
    validateSchema,
} from '../../helpers/generate-openapi-types';
import { ClientGeneratorSchema } from './schema';

export async function clientGenerator(tree: Tree, options: ClientGeneratorSchema) {
    const {
        name,
        schemaPath,
        remote,
        importPath = `@clients/${name}`,
        configPath,
        skipValidate = false,
    } = options;

    const projectRoot = `clients/${name}`;

    let existingProject = false;

    // Add to project config. If project already exists then ask to overwrite existing types/schema
    try {
        addProjectConfiguration(tree, name, {
            root: projectRoot,
            projectType: 'library',
            sourceRoot: `${projectRoot}/src`,
            targets: {
                validate: {
                    executor: 'nx:run-commands',
                    options: {
                        cwd: projectRoot,
                        command: 'npx @redocly/cli lint schema' + schemaPath.slice(-5),
                    },
                },
            },
            tags: ['client', name],
        });
        /* v8 ignore start */ // Testing this is a pain.
    } catch (error) {
        if (isExistingProject(error as Error)) {
            existingProject = true;
            const response = await confirmOverwrite(name);
            if (!response.overwrite) {
                console.log('Cancelling...');
                return;
            }
        } else {
            throw error;
        }
        /* v8 ignore end */
    }

    if (!skipValidate) {
        await validateSchema(schemaPath);
    }

    const contents = await generateOpenApiTypes(tree, schemaPath, remote, configPath);

    await copySchema(tree, name, schemaPath, remote);

    tree.write(`${projectRoot}/generated/index.ts`, contents);

    // Generate new files if the project is new
    if (!existingProject) {
        console.log('Generating supplementary files...');

        // Generate other files
        generateFiles(tree, joinPathFragments(__dirname, './files'), projectRoot, options);

        // Add the project to the tsconfig paths so it can be imported by namespace
        addTsConfigPath(tree, importPath, [joinPathFragments(projectRoot, './src', 'index.ts')]);
    }

    await formatFiles(tree);
}

export function isExistingProject(error: Error): boolean {
    return error.message.includes('already exists');
}

export async function confirmOverwrite(name: string): Promise<{ overwrite: boolean }> {
    return await prompt({
        type: 'confirm',
        name: 'overwrite',
        message: `Project ${name} already exists. Do you want to overwrite it?`,
    });
}

/**
 * These utility functions are only exported by '@nx/js', not '@nx/devkit'
 * They're simple so we recreate them here instead of adding '@nx/js' as a dependency
 * Source: {@link https://github.com/nrwl/nx/blob/master/packages/js/src/utils/typescript/ts-config.ts}
 */
export function getRootTsConfigPathInTree(tree: Tree): string {
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

export default clientGenerator;
