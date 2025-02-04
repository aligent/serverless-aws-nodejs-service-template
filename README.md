# Aligent AWS microservices template using Typescript and Serverless Framework

A template for developing a suite of AWS microservices using Typescript and [Serverless Framework](https://www.serverless.com/framework/docs).

The monorepo workspace is managed using [Nx.](https://nx.dev)

## Development

### Setup

1. Install `yarn` package manager following their [instruction](https://yarnpkg.com/getting-started/install)

2. Update application name in `package.json`. It's recommend to have the name in the format of: `@<brand-name>-int/<from>-<to>`. Eg: `@aligent-int/erp-ecomm`

3. Update brand name in `nx.json`. The naming convention for this is: `<brand-name>-int`. Just be mindful about the length of service name. Eg: `alg-int`

4. Install dependencies: `yarn install --immutable`

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

- The `tsconfig.base.json` file extends [@aligent/ts-code-standard](https://bitbucket.org/aligent/ts-code-standards/src/main) package. Please note that there are settings which is not shown in that file but still applied. For more information on those settings, visit https://github.com/tsconfig/bases.

- Following `@aligent/ts-code-standard`, we switched to the new [Eslint's FlatConfig](https://eslint.org/blog/2022/08/new-config-system-part-2/). If you're using [VSCode's Eslint extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint), turn on the `eslint.useFlatConfig` setting.

## Maintenance

### Upgrading NPM packages

#### Using Nx migration tool

Nx provides a [tool for automatically upgrading NPM packages](https://nx.dev/features/automate-updating-dependencies). We can leverage the tool but also need to double check as this tool may add or remove files that are not relevant to our workspace.

#### Manual

The NPM packages in `devDependencies` in this repository has a complicated relationship with each other. Therefore, upgrading them should be handled with care.

1. Remove `node_modules` folder if it exist.
2. Remove `package-lock.json` file.
3. Up date packages version number follow the instruction below:

   - All the `@nx` packages must be pinned at the same version with `nx` package to avoid conflict.

     ```json
       "@nx/devkit": "17.3.0",
       "@nx/esbuild": "17.3.0",
       "@nx/eslint": "17.3.0",
       "@nx/eslint-plugin": "17.3.0",
       "@nx/js": "17.3.0",
       "@nx/plugin": "17.3.0",
       "@nx/vite": "17.3.0",
       "@nx/workspace": "17.3.0",
       "nx": "17.3.0"
     ```

   - All the packages that are in the same scope should be at the same version. For example:

     ```json
       "@typescript-eslint/eslint-plugin": "^6.13.2",
       "@typescript-eslint/parser": "^6.13.2",
     ```

   - `@nx/esbuild` lists `esbuild` as peerDependency. Double check the required version of `esbuild` in `package.json` of this [package](https://www.npmjs.com/package/@nx/esbuild?activeTab=code) before upgrading.

   - `eslint` and `prettier` are a peerDependencies of the following packages. Double check the required versions in `package.json` of these packages before upgrading.
     - [@aligent/ts-code-standard](https://github.com/aligent/ts-code-standards/blob/main/package.json)
     - [eslint-plugin-import](https://www.npmjs.com/package/eslint-plugin-import?activeTab=code)
   - `@nx/vite` lists `vite` and `vitest` as peerDependencies. Double check the required version of `vite` and `vitest` in `package.json` of this [package](https://www.npmjs.com/package/@nx/vite?activeTab=code) before upgrading.
   - `vitest`, `@vitest/coverage-v8` and `@vitest/ui` should be at the same version.

4. Remove the three SWC packages (`@swc-node/register`, `@swc/core`, and `@swc/helpers`) from devDependencies. These packages are used by `@nx/js` package. However, there is no obvious way to find out which version of these packages are required. The best way to add them back is generating a share lib.

5. Run `npm install` to install all the dependencies. This will re-generate `node_modules` and `package-lock.json`.

6. Run `npx nx g library libs/test-lib --unitTestRunner=none` to add back the correct version of SWC packages that we removed in step 4 above.

7. Clean up by removing the newly generated `test-lib` by running `npx nx g rm test-lib`.

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
