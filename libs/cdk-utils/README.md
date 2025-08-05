# CDK Utils Library

This library provides utilities for AWS CDK applications, including property injectors for customizing resource naming.

## Constructs

This library contains custom constructs for common low level use cases. Constructs are all Property Injectable under the `@aligent.cdk-utils` namespace, and have support for defining default properties using AWS Context.

Current constructs:

- LambdaFunction
- StepFunctionFromFile

<details>

<summary>Instructions for working with Constructs</summary>

### Using the Constructs

The constructs in this library are decorated with `@propertyInjectable`, making them compatible with CDK's property injection system. They also support context-based default configuration.

#### LambdaFunction

Extends `NodejsFunction` with support for automatic aliasing

```typescript
import { LambdaFunction } from '@libs/cdk-utils/infra';
import { Duration } from 'aws-cdk-lib';
import { Runtime, Tracing } from 'aws-cdk-lib/aws-lambda';

// Basic usage
new LambdaFunction(this, 'MyFunction', {
  entry: 'src/lambda/handler.ts',
});
```

#### StepFunctionFromFile

A Step Function construct that loads its definition from a YAML or JSON file.

```typescript
import { StepFunctionFromFile } from '@libs/cdk-utils/infra';

// Basic usage
new StepFunctionFromFile(this, 'MyStateMachine', {
  filepath: 'src/step-functions/workflow.yml',
});
```

### Preparing Context Objects with Type Safety

Context allows you to define default properties that apply to all instances of a construct. Each construct provides a static `defineContext` method for type-safe context creation.

```typescript
// In applications/core/lib/application-context.ts
import { LambdaFunction, StepFunctionFromFile } from '@libs/cdk-utils/infra';
import { Duration } from 'aws-cdk-lib';
import { Runtime, Tracing } from 'aws-cdk-lib/aws-lambda';

export const APPLICATION_CONTEXT = {
  // Define defaults for all Lambda functions
  ...LambdaFunction.defineContext({
    timeout: Duration.seconds(6),
    memorySize: 192,
    runtime: Runtime.NODEJS_22_X,
    tracing: Tracing.ACTIVE,
    environment: {
      NODE_OPTIONS: '--enable-source-maps',
    },
    bundling: {
      sourceMap: true,
    },
    alias: 'LATEST',
  }),

  // Define defaults for all Step Functions
  ...StepFunctionFromFile.defineContext({
    tracingEnabled: true,
    alias: 'LATEST',
  }),

  // Add other application-wide context
  configFileName: 'app-config.json',
  clientName: 'my-org',
} as const;
```

**Note**: The `defineContext` method uses `Omit<>` to exclude required instance-specific properties (like `entry` for Lambda or `filepath` for Step Functions) from the context type, ensuring type safety.

### Injecting Context in an App

Context is injected at the App level and automatically flows down to all constructs.

```typescript
// In applications/core/bin/main.ts
import { App } from 'aws-cdk-lib';
import { APPLICATION_CONTEXT } from '../lib/application-context';

const app = new App({
  context: APPLICATION_CONTEXT,
});

// Now all LambdaFunction and StepFunctionFromFile constructs
// will automatically use the default values from context
```

### How Context Merging Works

When a construct is instantiated:

1. It retrieves default values from context using `scope.node.tryGetContext(CONTEXT_KEY)`
2. Instance-specific props are merged with defaults
3. Instance props take precedence over context defaults

```typescript
// This Lambda will use:
// - memorySize: 512 (overrides context default of 192)
// - timeout: 6 seconds (from context)
// - runtime: NODEJS_22_X (from context)
// - All other context defaults
new LambdaFunction(this, 'SpecialFunction', {
  entry: 'src/lambda/special.ts',
  memorySize: 512, // Override context default
});
```

### Property Injection Namespace

All constructs are injectable under the `@aligent.cdk-utils` namespace. This means property injectors can target them specifically:

```typescript
// Custom property injector for LambdaFunction
class MyLambdaInjector implements IPropertyInjector {
  readonly constructUniqueId = '@aligent.cdk-utils.LambdaFunction';

  inject(props: any, context: InjectionContext) {
    // Modify props here
    return props;
  }
}
```

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

## Override Naming Injectors

The `override-naming-injectors` module provides CDK property injectors that allow you to override the default naming of AWS resources.

Currently supported resources:

- StateMachine
- Function (Lambda)

<details>

<summary>Instructions for working with Override Naming Injectors</summary>

### Features

- Property injection-based approach for clean, non-intrusive naming overrides
- Support for Lambda Functions and Step Functions
- Flexible naming through custom formatting functions
- Works with CDK's native property injection system

### Available Injectors

#### OverrideFunctionNameInjector

Overrides the `functionName` property of Lambda functions using a custom formatting function.

```typescript
import { OverrideFunctionNameInjector } from '@cdk-utils/lib/injectors/override-naming-injectors';
import { App } from 'aws-cdk-lib';

const app = new App();

// Define your naming format
const formatName = (id: string) => `my-prefix-${id}-suffix`;

// Add the injector to the app
app.addPropertyInjector(new OverrideFunctionNameInjector(formatName));
```

#### OverrideStateMachineNameInjector

Overrides the `stateMachineName` property of Step Functions state machines using a custom formatting function.

```typescript
import { OverrideStateMachineNameInjector } from '@cdk-utils/lib/injectors/override-naming-injectors';
import { App } from 'aws-cdk-lib';

const app = new App();

// Define your naming format
const formatName = (id: string) => `workflow-${id}`;

// Add the injector to the app
app.addPropertyInjector(new OverrideStateMachineNameInjector(formatName));
```

### Usage Examples

#### Basic Usage with Both Injectors

```typescript
import { App, Stack } from 'aws-cdk-lib';
import { Function, Runtime, Code } from 'aws-cdk-lib/aws-lambda';
import { StateMachine, Pass } from 'aws-cdk-lib/aws-stepfunctions';
import {
  OverrideFunctionNameInjector,
  OverrideStateMachineNameInjector,
} from '@libs/cdk-utils/infra';

const app = new App();

// Create a naming format that includes service and stage
const serviceId = 'my-service';
const stage = 'dev';
const formatName = (id: string) => `${serviceId}-${stage}-${id}`;

// Add both injectors
app.addPropertyInjector(new OverrideFunctionNameInjector(formatName));
app.addPropertyInjector(new OverrideStateMachineNameInjector(formatName));

const stack = new Stack(app, 'MyStack');

// This Lambda will be named "my-service-dev-processor"
new Function(stack, 'processor', {
  runtime: Runtime.NODEJS_22_X,
  handler: 'index.handler',
  code: Code.fromInline('exports.handler = async () => {}'),
});

// This State Machine will be named "my-service-dev-workflow"
new StateMachine(stack, 'workflow', {
  definition: new Pass(stack, 'PassState'),
});
```

### Important Notes

1. **Resource Replacement**: Changing resource names after deployment will cause CloudFormation to replace the resources. Only use this during initial deployment or when resource replacement is acceptable.

2. **Name Constraints**: Ensure your formatting function produces valid names according to AWS service limits:
   - Lambda function names: 1-64 characters, alphanumeric and hyphens
   - Step Function names: 1-80 characters, alphanumeric, hyphens, and underscores

3. **Injection Order**: Only one property injector can be applied to each resource in CDK. If multiple injectors modify the same property, the last one wins.

4. **Scope**: Injectors added to the app apply to all stacks and constructs within that app.

### Migration from Serverless Framework

When migrating from Serverless Framework to CDK, you can use these injectors to maintain existing resource names:

```typescript
// Match Serverless naming: ${self:service}-${self:provider.stage}-${functionName}
const service = 'my-service';
const stage = 'prod';
const formatName = (id: string) => `${service}-${stage}-${id}`;

app.addPropertyInjector(new OverrideFunctionNameInjector(formatName));
```

### Supporting more resource types

To create injectors for other resource types, follow the same pattern:

```typescript
import { IPropertyInjector, InjectionContext } from 'aws-cdk-lib';
import { Bucket, BucketProps } from 'aws-cdk-lib/aws-s3';

export class OverrideBucketNameInjector implements IPropertyInjector {
  public readonly constructUniqueId = Bucket.PROPERTY_INJECTION_ID;

  constructor(private readonly formatName: (id: string) => string) {}

  public inject(originalProps: BucketProps, context: InjectionContext) {
    return {
      ...originalProps,
      bucketName: this.formatName(context.id),
    };
  }
}
```

</details>
