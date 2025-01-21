import { generateFiles } from "@nx/devkit";

export function generateOpenApiTypes() {
    const tree = process.argv[2]
    const options = process.argv[3]

    const {
        name,
        schemaPath,
        remote,
        configPath,
        importPath = `@clients/${name}`,
    } = options;

    const projectRoot = `clients/${name}`;

    // Parse schema into type definition
    let contents;
    if (remote) {
        console.log('Getting remote schema...');
        contents = await getRemoteSchema(schemaPath, configPath);
    } else {
        console.log(
            'Getting local schema... (use --remote to get remote schema)'
        );
        contents = await getLocalSchema(tree.root, schemaPath);
    }

    await validate(schemaPath);
    await copySchema(tree, name, schemaPath, remote);
}

