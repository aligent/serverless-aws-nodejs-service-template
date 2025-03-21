export interface ClientGeneratorSchema {
    name: string;
    schemaPath: string;
    remote?: boolean;
    configPath?: string;
    importPath?: string;
    skipValidate?: boolean;
}
