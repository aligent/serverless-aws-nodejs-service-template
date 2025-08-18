# CDK Utils Library

This library provides utilities for AWS CDK applications, including property injectors, aspects, and constructs for building scalable serverless applications.

## Constructs

This library contains custom constructs for common low level use cases.

Current constructs:

- StepFunctionFromFile - Load Step Function definitions from YAML/JSON files
- S3Bucket - S3 buckets with lifecycle management
- SsmParameterGroup - Group and manage SSM parameters

<details>

<summary>Instructions for working with Constructs</summary>

### StepFunctionFromFile

A Step Function construct that loads its definition from a YAML or JSON file.

```typescript
import { StepFunctionFromFile } from '@libs/cdk-utils/infra';

// Basic usage
new StepFunctionFromFile(this, 'MyStateMachine', {
  filepath: 'src/step-functions/workflow.yml',
});

// With Lambda function substitutions
new StepFunctionFromFile(this, 'WorkflowWithLambdas', {
  filepath: 'src/step-functions/workflow.yml',
  lambdaFunctions: [myLambda1, myLambda2],
  definitionSubstitutions: {
    MyCustomParam: 'CustomValue',
  },
});
```

### S3Bucket

An S3 bucket construct with built-in lifecycle management for different data retention needs.

```typescript
import { S3Bucket } from '@libs/cdk-utils';

// Short-lived data (7 days)
new S3Bucket(this, 'TempData', {
  duration: 'SHORT',
});

// Medium-lived data (30 days)
new S3Bucket(this, 'ProcessingData', {
  duration: 'MEDIUM',
});

// Long-lived data (365 days)
new S3Bucket(this, 'ArchiveData', {
  duration: 'LONG',
});

// Permanent data with versioning
new S3Bucket(this, 'ConfigData', {
  duration: 'PERMANENT',
  versioned: true,
});
```

### SsmParameterGroup

Abstract class to group SSM parameters together and manage permissions.

```typescript
import { SsmParameterGroup } from '@libs/cdk-utils';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';

class ApiCredentials extends SsmParameterGroup<'API_KEY' | 'API_SECRET'> {
  public readonly parameters;

  constructor(scope: Construct, id = 'ApiCredentials') {
    super(scope, id);

    this.parameters = {
      API_KEY: StringParameter.fromStringParameterName(
        this,
        'ApiKey',
        `/myapp/${this.stageName}/api/key`
      ),
      API_SECRET: StringParameter.fromStringParameterName(
        this,
        'ApiSecret',
        `/myapp/${this.stageName}/api/secret`
      ),
    };
  }
}

// Usage
const credentials = new ApiCredentials(this);
credentials.grantToFunction(myLambda, 'read');
```

</details>

## Property Injectors

This library provides configuration-aware property injectors that automatically configure resources based on your requirements. Property injectors use CDK's built-in property injection system to apply defaults without requiring custom constructs.

Current injectors:

- NodeJsFunctionDefaultsInjector - Configuration-specific Lambda function bundling and runtime settings
- LogGroupDefaultsInjector - Duration-based CloudWatch log group retention
- StepFunctionDefaultsInjector - Automatic logging for EXPRESS Step Functions
- BucketDefaultsInjector - Auto-cleanup policies for S3 buckets

<details>

<summary>Instructions for working with Property Injectors</summary>

### Using Property Injectors

Property injectors can be added at the app or stage level to apply configuration-specific defaults to all resources within that scope.

```typescript
import {
  NodeJsFunctionDefaultsInjector,
  LogGroupDefaultsInjector,
  StepFunctionDefaultsInjector,
  BucketDefaultsInjector,
} from '@libs/cdk-utils';
import { App, Stage } from 'aws-cdk-lib';

// Apply at app level
const app = new App({
  propertyInjectors: [
    new NodeJsFunctionDefaultsInjector({
      sourceMap: true,
      esm: true,
      minify: true,
    }).withProps({
      timeout: Duration.seconds(6),
      memorySize: 192,
      runtime: Runtime.NODEJS_22_X,
      architecture: Architecture.ARM_64,
    }),
    new LogGroupDefaultsInjector({ duration: 'MEDIUM' }),
    new StepFunctionDefaultsInjector(),
    new BucketDefaultsInjector(),
  ],
});

// Or override at stage level
new ApplicationStage(app, 'dev', {
  propertyInjectors: [
    new NodeJsFunctionDefaultsInjector({
      sourceMap: false,
      esm: true,
      minify: false, // Faster builds for dev
    }),
    new LogGroupDefaultsInjector({ duration: 'SHORT' }), // Shorter retention for dev
  ],
});
```

### NodeJsFunctionDefaultsInjector

Applies configuration-specific bundling and runtime settings to Lambda functions:

```typescript
// Development configuration - fast builds
new NodeJsFunctionDefaultsInjector({
  sourceMap: false,
  esm: true,
  minify: false,
});

// Production configuration - optimized bundles
new NodeJsFunctionDefaultsInjector({
  sourceMap: true,
  esm: true,
  minify: true,
});

// Functions automatically inherit configuration
new NodejsFunction(stack, 'MyFunction', {
  handler: 'index.handler',
  entry: 'src/lambda/handler.ts',
  // Bundling, source maps, ESM support applied via injector
});
```

### LogGroupDefaultsInjector

Applies duration-based retention and removal policies:

```typescript
// Short retention (1 week)
new LogGroupDefaultsInjector({ duration: 'SHORT' });

// Medium retention (6 months)
new LogGroupDefaultsInjector({ duration: 'MEDIUM' });

// Long retention (2 years)
new LogGroupDefaultsInjector({ duration: 'LONG' });

// Log groups automatically inherit retention settings
new LogGroup(stack, 'MyLogGroup');
// Retention and removal policies applied via injector
```

### StepFunctionDefaultsInjector

Automatically creates log groups and configures logging for EXPRESS Step Functions:

```typescript
// Log group and logging configuration added automatically for EXPRESS type
new StateMachine(stack, 'MyExpressWorkflow', {
  stateMachineType: StateMachineType.EXPRESS,
  definitionBody: DefinitionBody.fromFile('workflow.asl.yaml'),
});
```

### BucketDefaultsInjector

Automatically configures S3 buckets for clean stack deletion:

```typescript
// Default configuration
new BucketDefaultsInjector();
// Applies: autoDeleteObjects: true, removalPolicy: DESTROY

// Custom configuration
new BucketDefaultsInjector({
  autoDelete: false,
  removalPolicy: 'RETAIN',
});

// Buckets automatically get cleanup defaults
new Bucket(stack, 'MyBucket');
// Auto-delete and removal policies applied via injector
```

### Customizing Injector Defaults

You can override injector defaults using the `withProps` method:

```typescript
const customInjector = new NodeJsFunctionDefaultsInjector({
  sourceMap: true,
  esm: true,
  minify: true,
}).withProps({
  memorySize: 512, // Override default memory
  timeout: Duration.seconds(30), // Override default timeout
  environment: {
    LOG_LEVEL: 'DEBUG',
  },
});
```

</details>

## Aspects

This library provides aspects that automatically apply cross-cutting concerns to resources.

Current aspects:

- VersionFunctionsAspect - Automatic versioning and aliasing for Lambda functions and Step Functions

<details>

<summary>Instructions for working with Aspects</summary>

### VersionFunctionsAspect

Automatically creates versions and aliases for Lambda functions and Step Functions. This is essential for blue-green deployments and traffic shifting.

```typescript
import { VersionFunctionsAspect } from '@libs/cdk-utils';
import { Aspects } from 'aws-cdk-lib';

// Apply to entire app for automatic versioning
Aspects.of(app).add(new VersionFunctionsAspect());

// Or with custom alias name
Aspects.of(app).add(new VersionFunctionsAspect({ alias: 'PROD' }))
```

**What it does:**

- **Lambda Functions**: Adds a function alias (default: "LATEST")
- **Step Functions**: Creates a version and alias with 100% traffic routing

**Benefits:**

- Enables blue-green deployments
- Supports traffic shifting between versions
- Provides stable ARNs for external integrations
- Required for some AWS services that need versioned resources

</details>

## CDK-NAG Rules

This library contains a custom [cdk-nag](https://github.com/cdklabs/cdk-nag) NagPack called `MicroserviceChecks` for testing CDK stacks. The NagPack contains a small subset of standard rules to support rapid development

Current rules:

- Explicit memory and timeout settings for Lambda functions
- Active tracing for Lambda functions
- Retention policies for CloudWatch Log Groups

<details>

<summary>Instructions for working with cdk-nag rules</summary>

### Using MicroserviceChecks in Tests

The `MicroserviceChecks` NagPack validates your CDK stacks against microservice best practices. It's designed to be used in your CDK test files to ensure compliance before deployment.

#### Basic Usage

```typescript
import { App, Stack } from 'aws-cdk-lib';
import { Aspects } from 'aws-cdk-lib';
import { Annotations, Match } from 'aws-cdk-lib/assertions';
import { MicroserviceChecks } from '@libs/cdk-utils/infra';

describe('MyStack', () => {
  it('complies with microservice checks', () => {
    const app = new App();
    const stack = new Stack(app, 'TestStack');

    // ... create your stack resources ...

    // Apply the MicroserviceChecks
    Aspects.of(stack).add(new MicroserviceChecks());

    // Check for any errors
    const errors = Annotations.fromStack(stack).findError(
      '*',
      Match.stringLikeRegexp('Microservices.*')
    );

    expect(errors).toHaveLength(0);
  });
});
```

#### Handling Violations

When a rule is violated, you'll see an error like:

```
Microservices-L1: Lambda function 'MyFunction' must have memory size explicitly configured
```

Violations can be fixed on individual resources like below, but it is recommended to set defaults throughout the entire application using AWS Context or custom constructs

```typescript
// ❌ Bad - Uses default memory
new Function(this, 'MyFunction', {
  runtime: Runtime.NODEJS_22_X,
  handler: 'index.handler',
  code: Code.fromInline('...'),
});

// ✅ Good - Explicit configuration
new Function(this, 'MyFunction', {
  runtime: Runtime.NODEJS_22_X,
  handler: 'index.handler',
  code: Code.fromInline('...'),
  memorySize: 256,
  timeout: Duration.seconds(30),
  tracing: Tracing.ACTIVE,
});
```

#### Suppressing Rules

If you need to suppress a specific rule for a valid reason:

```typescript
import { NagSuppressions } from 'cdk-nag';

// Suppress for a specific resource
NagSuppressions.addResourceSuppressions(myFunction, [
  {
    id: 'Microservices-L1',
    reason: 'This function requires default memory for testing purposes',
  },
]);

// Suppress by path
NagSuppressions.addResourceSuppressionsByPath(stack, '/MyStack/MyFunction', [
  {
    id: 'Microservices-L1',
    reason: 'Documented exception for this resource',
  },
]);
```

#### Integration with CI/CD

```typescript
// In your CDK test file
describe('Infrastructure Compliance', () => {
  let app: App;
  let stack: Stack;

  beforeEach(() => {
    app = new App();
    stack = new MyApplicationStack(app, 'TestStack');
    Aspects.of(stack).add(new MicroserviceChecks());
  });

  test('No microservice check violations', () => {
    // This will fail the test if any violations are found
    const errors = Annotations.fromStack(stack).findError(
      '*',
      Match.stringLikeRegexp('Microservices.*')
    );

    if (errors.length > 0) {
      console.error('Microservice check violations:', errors);
    }

    expect(errors).toHaveLength(0);
  });
});
```

#### Custom Rule Configuration

While the current implementation uses standard rules, you can extend the MicroserviceChecks class:

```typescript
import { MicroserviceChecks } from '@libs/cdk-utils/infra';

class CustomMicroserviceChecks extends MicroserviceChecks {
  constructor() {
    super();
    // Add custom rules or modify existing ones
  }
}
```

</details>

