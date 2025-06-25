# CDK Utils Library

This library provides utilities for AWS CDK applications, including tools for maintaining backward compatibility with legacy naming conventions.

## Legacy Naming Injector

The `LegacyNamingInjector` is a CDK Aspect that automatically applies legacy naming conventions to AWS resources. This is particularly useful when migrating from Serverless Framework to CDK, where you need to maintain existing resource names to avoid breaking changes.

### Features

- Applies consistent naming patterns across resources
- Supports Lambda Functions, Step Functions, S3 Buckets, and DynamoDB Tables
- Optional and non-intrusive - only applies when explicitly enabled
- Configurable naming patterns

### Naming Convention

The injector applies the following naming pattern to resources:
```
${serviceId}-${stageName}-${resourceName}
```

For example:
- Lambda function with ID `hello` becomes `legacy-service-stg-hello`
- Step Function with ID `helloWorld` becomes `legacy-service-stg-hello-world`
- S3 Bucket with ID `configBucket` becomes `legacy-service-stg-config-bucket-a1b2c3d4`

### Usage

#### Basic Usage in a Stack

```typescript
import { Stack, StackProps, Stage } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { LegacyNamingInjector } from '@aligent/cdk-utils';

export interface MyStackProps extends StackProps {
  useLegacyNaming?: boolean;
}

export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props?: MyStackProps) {
    super(scope, id, props);

    // Apply legacy naming if enabled
    if (props?.useLegacyNaming) {
      new LegacyNamingInjector(this, {
        serviceId: id,
        stageName: Stage.of(this)?.stageName || 'dev'
      });
    }

    // Define your resources as normal
    const myFunction = new Function(this, 'hello', {
      // ... function props
    });
    // If legacy naming is enabled, this function will be named:
    // "my-stack-stg-hello" (assuming stage is 'stg')
  }
}
```

#### Using in Application Stage

```typescript
import { Stage, StageProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class ApplicationStage extends Stage {
  constructor(scope: Construct, stage: string, props?: StageProps) {
    super(scope, stage, props);

    // Create stacks with legacy naming enabled
    new LegacyStack(this, 'legacy-service', {
      ...props,
      useLegacyNaming: true, // Enable for legacy services
    });

    new ModernStack(this, 'modern-service', {
      ...props,
      useLegacyNaming: false, // Disable for new services
    });
  }
}
```

### Configuration Options

```typescript
interface LegacyNamingInjectorProps {
  // The service identifier (required)
  serviceId: string;
  
  // The stage name (required)
  stageName: string;
  
  // The separator to use in names (default: '-')
  separator?: string;
  
  // Whether to add unique suffix to S3 buckets (default: true)
  uniqueBucketSuffix?: boolean;
}
```

### Supported Resources

The following AWS resources are supported:

| Resource Type | Property Modified | Example Output |
|--------------|------------------|----------------|
| Lambda Function | `functionName` | `my-service-prd-process-data` |
| Step Function | `stateMachineName` | `my-service-prd-workflow` |
| S3 Bucket | `bucketName` | `my-service-prd-assets-a1b2c3d4` |
| DynamoDB Table | `tableName` | `my-service-prd-users` |

### Important Notes

1. **S3 Bucket Names**: S3 bucket names must be globally unique. The injector automatically:
   - Adds a unique suffix based on the stack's ID
   - Converts names to lowercase
   - Replaces invalid characters with hyphens
   - Truncates names longer than 63 characters

2. **Resource Replacement**: Changing resource names after deployment will cause CloudFormation to replace the resources. Only use this during initial deployment or migration.

3. **Construct IDs**: The injector uses the construct's ID (not the logical ID) to generate names. It automatically:
   - Converts camelCase to kebab-case
   - Removes common prefixes like 'Cfn'
   - Converts to lowercase

### Migration Guide

When migrating from Serverless Framework to CDK:

1. **Identify existing resource names** in your Serverless configuration
2. **Match construct IDs** in CDK to generate the same names
3. **Enable legacy naming** for the migrated stack
4. **Deploy and verify** that resources maintain their names

Example migration:

```yaml
# Serverless Framework (serverless.yml)
functions:
  hello:
    name: ${self:service}-${self:provider.stage}-hello
```

```typescript
// CDK equivalent
const helloLambda = new Function(this, 'hello', {
  // The LegacyNamingInjector will apply the same naming pattern
});
```

### Troubleshooting

**Q: My resource names don't match the legacy pattern**
- Ensure the construct ID matches what you expect
- Check that the injector is applied before creating resources
- Verify the serviceId and stageName are correct

**Q: S3 bucket names have unexpected suffixes**
- This is intentional for uniqueness. Set `uniqueBucketSuffix: false` if you need exact names (ensure they're globally unique)

**Q: Some resources aren't getting renamed**
- Only supported resource types are affected. Check the supported resources table above
- Custom constructs may need additional handling

### Future Enhancements

Potential future additions:
- Support for more resource types (SNS topics, SQS queues, etc.)
- Custom naming patterns via configuration
- Integration with AWS Systems Manager Parameter Store for name mappings
- Validation against existing CloudFormation stacks