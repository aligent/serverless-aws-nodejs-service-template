# openapi-plugin

This library was generated with [Nx](https://nx.dev).

The openapi-plugin can create api clients based on local or remote schema files. The source files must be .yaml or .json and must adhere to the OpenAPI Specification 3.0.0

## Usage

To build a new client in the clients folder:

- Run `nx g client`
- Follow the prompts to name and provide a source file

To build with flags (without needing to prompt):
Run `nx g client` with optional flags:

- --name Name of the api client.
- --schemaPath Path to the schema. If using the --remote flag then you must specify a valid remote URL. If not you must specify a local file.
- --configPath path to the redocly config file responsible for auth. For more information: https://openapi-ts.dev/cli#auth.
- --remote Specify whether you would like to fetch remotely.

## Building

Run `nx build openapi-plugin` to build the library.

## Running unit tests

Run `nx test openapi-plugin` to execute the unit tests.
