# Maintenance

## Upgrading NPM packages

The NPM packages in `devDependencies` in this repository has a complicated relationship with each other. Therefore, upgrading them should be handled with care.

- All the `@nx` packages must be pinned at the same version with `nx` package to avoid conflict.

  ```json
    "@nx/devkit": "21.2.2",
    "@nx/esbuild": "21.2.2",
    "@nx/eslint": "21.2.2",
    "@nx/eslint-plugin": "21.2.2",
    "@nx/js": "21.2.2",
    "@nx/vite": "21.2.2",
    "@nx/web": "21.2.2",
    ...
    "nx": "21.2.2"
  ```

- All the packages that are in the same scope should be at the same version. For example:

  ```json
    "@typescript-eslint/eslint-plugin": "^8.36.0",
    "@typescript-eslint/parser": "^8.36.0",
  ```

- `@nx/esbuild` lists `esbuild` as peerDependency. Double check the required version of `esbuild` in `package.json` of this [package](https://www.npmjs.com/package/@nx/esbuild?activeTab=code) before upgrading.
- `eslint` and `prettier` are a peerDependencies of the following packages. Double check the required versions in `package.json` of these packages before upgrading.
  - [@aligent/ts-code-standard](https://bitbucket.org/aligent/ts-code-standards/src/main/package.json)
  - [eslint-plugin-import](https://www.npmjs.com/package/eslint-plugin-import?activeTab=code)
- `@nx/vite` lists `vite` and `vitest` as peerDependencies. Double check the required version of `vite` and `vitest` in `package.json` of this [package](https://www.npmjs.com/package/@nx/vite?activeTab=code) before upgrading.
  - `vitest`, `@vitest/coverage-v8` and `@vitest/ui` should be at the same version.
