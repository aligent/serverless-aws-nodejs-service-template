# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Testing

- **Run tests for affected projects**: `yarn test`
- **Run tests for all projects**: `yarn test:all`
- **Run a single test file**: `npx vitest run path/to/test.spec.ts`
- **Run tests in watch mode**: `npx vitest watch`

### Code Quality

- **Lint affected projects**: `yarn lint`
- **Lint all projects**: `yarn lint:all`
- **Type check affected projects**: `yarn typecheck`
- **Type check all projects**: `yarn typecheck:all`

### Service Management

- **Generate new service**: `npx nx g service <service-name>`
- **Generate notification service**: `npx nx g service <service-name> notification`
- **Deploy service to AWS**: `npx nx deploy <service-name> -- -s <stage> --aws-profile <profile>`
- **Remove service from AWS**: `npx nx run <service-name>:remove -- -s <stage> --aws-profile <profile>`

### CDK Deployment

- **Deploy all stacks**: `cd applications/core && cdk deploy`
- **Deploy staging stacks**: `cd applications/core && cdk deploy stg/**`
- **Deploy production stacks**: `cd applications/core && cdk deploy prd/**`
- **View CDK diff**: `cd applications/core && cdk diff`

### API Client Generation

- **Generate typed API client**: `npx nx g client <client-name>`

## Architecture Overview

This is an AWS microservices template using:

- **Nx monorepo** structure with services in `services/` and libraries in `libs/`
- **AWS CDK v2** for infrastructure as code (recently migrated from Serverless Framework)
- **TypeScript** with strict type checking extending @aligent/ts-code-standards
- **Node.js 22.14.0** runtime

### Key Architecture Patterns

1. **Service-Based Architecture**

   - Each service is a separate CDK Stack defined in `services/<service-name>/src/index.ts`
   - Services export a Stack class that extends `aws-cdk-lib.Stack`
   - Services are imported and instantiated in `applications/core/lib/create-application-stacks.ts`

2. **CDK Application Structure**

   - Entry point: `applications/core/bin/main.ts` creates CDK App and stages
   - Stages (dev/stg/prd) are created as ApplicationStage instances directly in `main.ts`
   - Stage-specific configuration is applied via property injectors and aspects
   - Each stage automatically configures resources based on deployment environment

3. **Lambda and Step Functions**

   - Lambda functions are in `services/<service>/src/lambda/`
   - Step Functions use YAML definitions in `services/<service>/src/step-functions/`
   - Shared constructs in `services/<service>/src/lib/constructs/`
   - Step Functions use JSONata for output transformations
   - Automatic versioning and aliasing applied via VersionResourcesAspect
   - Stage-specific configuration applied via property injectors

4. **Property Injection Architecture**

   - Stage-specific defaults applied via property injectors (NodeJsFunctionDefaultsInjector, LogGroupDefaultsInjector, StepFunctionDefaultsInjector)
   - Cross-cutting concerns handled by aspects (VersionResourcesAspect for automatic versioning)
   - Configuration scales automatically with environment (dev/stg/prd)
   - No need for custom constructs - uses CDK's built-in property injection system

5. **Testing Strategy**
   - Vitest for unit testing with coverage reports
   - Test files colocated with source files as `*.spec.ts` or `*.test.ts`
   - Workspace-level Vitest configuration in `vitest.workspace.ts`

## Important Context

### CDK Migration Notes

- Project migrated from Serverless Framework to CDK using property injection pattern
- CDK construct IDs are critical - changing them will replace resources
- Lambda versions and aliases are automatically created via VersionResourcesAspect
- Step Functions use `LambdaInvoke` resource with automatic retry blocks
- Task outputs are nested in `Payload` property - use JSONata to transform
- Stage-specific resource configuration handled by property injectors

### Configuration

- Update brand name in `nx.json` generators section before first use
- Package name in `package.json` should follow `@<brand>-int/integrations` format
- Services are tagged with STAGE and SERVICE tags automatically

### Development Workflow

1. Always run lint and type checks before committing
2. Use Nx affected commands to optimize CI/CD performance
3. Follow existing code patterns and conventions in the codebase
4. Check `CDK-MIGRATION-NOTES.md` for CDK-specific guidance
