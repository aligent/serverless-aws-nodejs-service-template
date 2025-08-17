# Migrating from v3 Serverless Framework services

## Service and resource naming conventions

Serverless Framework services used a static naming convention instead of allowing AWS to control the naming of resources.

If you need to support this, the `@aligent/cdk-utils` toolset provides property injectors for easy stack-wide overriding of resource names.

```typescript
const legacyNameFormatter = (id: string) => `legacy-service-${stage}-${id}`;
new LegacyStack(this, 'legacy-service', {
  ...props,
  description: 'Legacy service template generated using Nx',
  propertyInjectors: [
    new OverrideFunctionNameInjector(legacyNameFormatter),
    new OverrideStateMachineNameInjector(legacyNameFormatter),
  ],
});
```

## Migrating S3 Buckets

If migrating from the deprecated `ConfigBucket` or `TemporaryDataBucket` constructs:

```typescript
// Old approach (deprecated)
import { ConfigBucket, TemporaryDataBucket } from '@libs/cdk-utils';

// New approach - Use S3Bucket with duration
import { S3Bucket } from '@libs/cdk-utils';

new S3Bucket(this, 'DataBucket', {
  duration: 'SHORT', // 7 days
  // or 'MEDIUM' (30 days), 'LONG' (365 days), 'PERMANENT'
});

// Or use standard Bucket with BucketDefaultsInjector
import { BucketDefaultsInjector } from '@libs/cdk-utils';

PropertyInjectors.of(this).add(new BucketDefaultsInjector());
new Bucket(this, 'MyBucket'); // Auto-cleanup applied
```

# Differences between serverless framework and cdk templates

## Deployment

CDK will produce a list of changes and ask permission to proceed

## Ids

The second argument for a construct is its ID. This is used by CDK to generate a logical id, and thus track the resource for replacement, deletion etc. It's important that this logical ID is not changed by accident.

## Aliases and Versioning

The latest version of deployed lambdas and step functions now has an alias of LATEST. This is handled automatically by the `VersionFunctionsAspect`:

```typescript
import { VersionFunctionsAspect } from '@libs/cdk-utils';
import { Aspects } from 'aws-cdk-lib';

// Apply to production stage for automatic versioning
Aspects.of(prdStage).add(new VersionFunctionsAspect());
```

## Step Functions

CDK Step Function setup produces a different base definition for lambda tasks

- Uses the `LambdaInvoke` resource, not the Lambda ARN directly
- Automatically adds a retry block for internal AWS service failures
- Outputs the task result nested inside the `Payload` property on a metadata object

To get task outputs similar to the direct lambda resource invocation, we can use the new Jsonata syntax and the `outputs` property.
Jsonata data transformation documentation: https://docs.aws.amazon.com/step-functions/latest/dg/transforming-data.html

## Property Injectors

The new architecture uses configuration-based property injectors instead of stage-based configuration:

```typescript
// App-level configuration
const app = new App({
  propertyInjectors: [
    new NodeJsFunctionDefaultsInjector({
      sourceMap: true,
      esm: true,
      minify: true,
    }).withProps({
      timeout: Duration.seconds(6),
      memorySize: 192,
    }),
    new LogGroupDefaultsInjector({ duration: 'MEDIUM' }),
    new BucketDefaultsInjector(),
  ],
});

// Stage-level overrides
new ApplicationStage(app, 'dev', {
  propertyInjectors: [
    new NodeJsFunctionDefaultsInjector({
      sourceMap: false,
      minify: false, // Faster builds for dev
    }),
    new LogGroupDefaultsInjector({ duration: 'SHORT' }),
  ],
});
```

# CDK Documentation

## AWS

https://docs.aws.amazon.com/cdk/v2/guide/home.html
https://docs.aws.amazon.com/cdk/v2/guide/best-practices.html

## Community documentation

https://github.com/kevinslin/open-cdk

## Issues

- cdk-nag (and Aspects in general) do **not** work with CDK Stages: https://github.com/cdklabs/cdk-nag/issues/1726

# Questions

- CDK best practices are to NOT name resources directly. I'm not exactly sure what this means though - does it apply to Lambda.functionName, for instance?
  - YES. We can support legacy naming to some extent, but new stacks should allow CDK to name things
- Should we continue to version lambda functions? I don't think I've ever invoked an older version.
  - YES. Eventually we want to move closer to continuous deployment with rollbacks
- What's a useful alias strategy? Eventually we want to
- How do we get step functions to call other step functions, especially in yaml definition?
- How do we get step functions to reference the stage name and other env variables?
- How do we work with env variables in general? What about the ones in SSM?
  - Use `cdk.context.json` for things we want to configure at deploy time.
- What does testing look like now?
- Do we need a typesafe way of declaring/fetching default config using the context system?
