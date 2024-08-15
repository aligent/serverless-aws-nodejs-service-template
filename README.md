# Aligent AWS microservices template using Typescript and Serverless Framework

A template for developing a suite of AWS microservices using Typescript and [Serverless Framework](https://www.serverless.com/framework/docs).

The monorepo workspace is managed using [Nx.](https://nx.dev)

## Development

### Setup

1. Update application name in `package.json`. It's recommend to have the name in the format of: `@<brand-name>-int/<from>-<to>`. Eg: `@aligent-int/erp-ecomm`

2. Update brand name in `nx.json`. The naming convention for this is: `<brand-name>-int`. Just be mindful about the length of service name. Eg: `alg-int`

3. Install dependencies: `npm ci`

### Working with services

Services are generated by our `@aligent/serverless-plugin`. It supports generating services based on our predefined template and some executors as described below.

#### Service generator (for generating new service)

- To generate a service, use the command:

  ```bash
  npx nx g service <service-name>
  # The command above is equivalent to 'npx nx g service <service-name> general'
  ```

- To generate a `notification` service, use the command:
  ```bash
  npx nx g service <service-name> notification
  ```

#### Service executors

Our service executors are `lint`, `test`, `check-types`, `build`, `deploy` and `remove`. Executor can be executed using the command in the format:

`npx nx run <service-name>:<executor> -- --<options>` or `npx nx <executor> <service-name> -- --<options>`

- To deploy a service to AWS:

  `npx nx deploy <service-name> -- -s <stage-name> --aws-profile <profile-name> --verbose`

- To remove a service from AWS:

  `npx nx run <service-name>:remove -- -s <stage-name> --aws-profile <profile-name> --verbose`

### Working with libraries

Libraries are generated by `@nx/js` plugin. For more information, check out their [document](https://nx.dev/packages/js).

#### Generate a shared library

`npx nx g library <library-name>`

Shared library will need to have the `check-types` command added manually to ensure proper type checking. This is because the the `@nx/js` plugin does not add it by default.

```json
"check-types": {
    "executor": "nx:run-commands",
    "options": {
        "cwd": "{projectRoot}",
        "color": true,
        "command": "tsc --noEmit --pretty"
    },
}
```

### General Nx. commands

Below are some example of general Nx. commands. For more information, check out their [document](https://nx.dev/packages/nx/documents).

- Remove a service or library:

  `npx nx g rm <project-name>`

- To run executors (`lint`, `test`, `format`, etc..) for all the projects:

  `npx nx run-many -t <list-of-executors-separated-by-space-or-comma>`

- To run executors for only affected projects:

  `npx nx affected -t <list-of-executors-separated-by-space-or-comma>`

## Notes:

- The `tsconfig.base.json` file extends `@tsconfig/node20` and `@tsconfig/strictest` packages. Please note that there are settings which is not shown in that file but still applied. For more information on those settings, visit https://github.com/tsconfig/bases.

- This template is package manager agnostic. To use other package manager, install them by enabling [corepack](https://pnpm.io/installation#using-corepack).

## Under development

- [-] Deployment pipeline -> nodeJS container + pnpm
- [x] Typescript compilation to check types (`tsc --noEmit`)
- [x] Root client configuration (e.g. service name prefix)
- [-] Base vite configuration -> this works for service generator.
- [ ] Importing code from internal libraries
- [ ] Bespoke library generator -> use same base vite configuration if we do this.
- [ ] Develop workspace [preset](https://nx.dev/extending-nx/recipes/create-preset)
- [x] Pre-commit hooks
- [x] Add error notification service
- [ ] Add step function metric configuration
