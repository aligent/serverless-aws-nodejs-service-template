# openapi-plugin

This library was generated with [Nx](https://nx.dev).

The openapi-plugin can create api clients based on local or remote schema files. The source files must be .yaml or .json and must adhere to the OpenAPI Specification 3.0.0

## Usage

### Generating a new client

To build a new client in the clients folder:

- Run `nx g client`
- Follow the prompts to name and provide a source file

To build with flags (without needing to prompt):
Run `nx g client` with optional flags:

- `--name` Name of the api client.
- `--schemaPath` Path to the schema. If using the --remote flag then you must specify a valid remote URL. If not you must specify a local file.
- `--remote` Specify whether you would like to fetch remotely.
- `--configPath` path to the redocly config file responsible for authentication when fetching a schema remotely. For more information: https://openapi-ts.dev/cli#auth.
- `--skipValidate` If passed, this will skip schema pre-validation. Only do this if you have good reason to - not validating the schema beforehand may produce unpredictable results (either things may not generate at all or they may generate something that is incorrect).

**Do not edit the files in the `/generated` folder after generating a client. These files are generated using the OpenAPI Schema and editing them may put you at risk of no longer conforming to the specifications of the API you are using!**

### Regenerating types for an existing client

To regenerate an existing client run the same generator command again (as above). If the client already exists in the Nx project, after confirmation it will have its types file regenerated from either the existing schema or a newly provided one.

## Development

### Building

Run `nx build openapi-plugin` to build the library.

### Running unit tests

Run `nx test openapi-plugin` to execute the unit tests.

### Details

The plugin was created following the standards for Nx custom plugins. It contains a single `generator.ts` file which is responsible for the main logic behind generating the client.
For more information on client generation check [Nx plugin documentation]()

Normally, plugin generator take pre-defined files specified in the `/files` directory and automatically use that a basis for writing to a `Tree` object (the data structure Nx uses to generate files).
Since we are using `openapi-typescript` to generate files in real time, we can simply create a pre-defined template. And must therefore write to the tree ourselves. We do this by taking the output of the Typescript generation and calling a built in `write` process, to write the returned generated code into a file whilst the generator runs.

The flow for the generator is as follows:

```mermaid
graph LR;
  R[Recieve path arguments from Nx cli]-->GL[Get local schema from filesystem];
  R-->GR[Get remote schema from url];
  GL-->G[Generate TS];
  GR-->G;
  G-->W[Write generated .ts file to tree];
  W-->NX[Nx generator uses tree to build directory];
  NX-->C[Cleanup];
```

## What gets generated?

The generator will generate two main things:

A `types` file that will contain several typescript interfaces depending on the OpenAPI schema specification it was passed:

- `paths`: Defines the routes that the API has as well as what parameters you can pass into them and what you should expect in return. [More information](https://swagger.io/docs/specification/v3_0/paths-and-operations/#paths)
- `operations`: The defined operations that can be performed on a given path. [More information.](https://swagger.io/docs/specification/v3_0/paths-and-operations/#operations)
- `components`: A way of avoid duplication when paths or operations contain the same structure in their responses. Components define a structure that is used multiple time throughout the API. [More information.](https://swagger.io/docs/specification/v3_0/components/)
