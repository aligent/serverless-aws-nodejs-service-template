# CDK Utils Library

This library provides utilities for AWS CDK applications, including property injectors, aspects, and constructs for building scalable serverless applications.

## Constructs

This library contains custom constructs for common low level use cases.

Current constructs:

- StepFunctionFromFile

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

</details>

## Property Injectors

This library provides stage-aware property injectors that automatically configure resources based on deployment stage (dev/stg/prd). Property injectors use CDK's built-in property injection system to apply defaults without requiring custom constructs.

Current injectors:

- NodeJsFunctionDefaultsInjector - Stage-specific Lambda function configuration
- LogGroupDefaultsInjector - Stage-specific CloudWatch log group configuration  
- StepFunctionDefaultsInjector - Automatic logging for EXPRESS Step Functions

<details>

<summary>Instructions for working with Property Injectors</summary>

### Using Property Injectors

Property injectors are typically added at the application stage level to apply stage-specific defaults to all resources within that stage.

```typescript
import {
  NodeJsFunctionDefaultsInjector,
  LogGroupDefaultsInjector,
  StepFunctionDefaultsInjector,
} from '@libs/cdk-utils';
import { PropertyInjectors, Stage } from 'aws-cdk-lib';

class ApplicationStage extends Stage {
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    // Apply stage-specific defaults
    PropertyInjectors.of(this).add(
      new NodeJsFunctionDefaultsInjector(id).addProps({
        timeout: Duration.seconds(6),
        memorySize: 192,
        runtime: Runtime.NODEJS_22_X,
        tracing: Tracing.ACTIVE,
        architecture: Architecture.ARM_64,
      }),
      new StepFunctionDefaultsInjector(id),
      new LogGroupDefaultsInjector(id)
    );
  }
}
```

### NodeJsFunctionDefaultsInjector

Applies stage-specific defaults to Lambda functions:

- **dev**: Optimized for debugging (source maps disabled, minimal bundling)
- **stg**: Balanced configuration (source maps enabled, optimized bundling)
- **prd**: Optimized for production (minified, tree-shaking enabled)

```typescript
// Stage-specific bundling configuration is applied automatically
new Function(stack, 'MyFunction', {
  runtime: Runtime.NODEJS_22_X,
  handler: 'index.handler',
  code: Code.fromAsset('src/lambda'),
  // Bundling configuration, source maps, etc. applied via injector
});
```

### LogGroupDefaultsInjector

Applies stage-specific retention and removal policies:

- **dev**: 1 week retention, DESTROY removal policy
- **stg**: 6 months retention, DESTROY removal policy  
- **prd**: 2 years retention, RETAIN removal policy

```typescript
// Retention and removal policies applied automatically
new LogGroup(stack, 'MyLogGroup');
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

### Customizing Injector Defaults

You can override injector defaults using the `addProps` method:

```typescript
new NodeJsFunctionDefaultsInjector('prd').addProps({
  memorySize: 512, // Override default memory
  timeout: Duration.seconds(30), // Override default timeout
});
```

</details>

## Aspects

This library provides aspects that automatically apply cross-cutting concerns to resources.

Current aspects:

- VersionResourcesAspect - Automatic versioning and aliasing for Lambda functions and Step Functions

<details>

<summary>Instructions for working with Aspects</summary>

### VersionResourcesAspect

Automatically creates versions and aliases for Lambda functions and Step Functions. This is essential for blue-green deployments and traffic shifting.

```typescript
import { VersionResourcesAspect } from '@libs/cdk-utils';
import { Aspects } from 'aws-cdk-lib';

// Apply to entire app for automatic versioning
Aspects.of(app).add(new VersionResourcesAspect());

// Or with custom alias name
Aspects.of(app).add(new VersionResourcesAspect({ alias: 'PROD' }));
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

