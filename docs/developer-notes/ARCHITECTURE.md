# Architecture Guidelines

This document outlines the architectural patterns and best practices for building microservices in this CDK-based monorepo.

## Core Architectural Principles

### 1. Service Composition in Application Stages

Services are composed in the CDK application through a centralized pattern:

#### Application Stage Structure

```typescript
// application/lib/create-application-stacks.ts
import { YourServiceStack } from '@services/your-service-name';

export function createApplicationStacks(scope: Construct, stage: string, props?: StageProps) {
  new YourServiceStack(scope, 'your-service-name', {
    ...props,
    description: 'Your service description',
  });
}
```

#### Service Stack Constructor Pattern

All services must follow this standardized constructor signature:

```typescript
export class YourServiceStack extends Stack {
  constructor(
    scope: Construct,
    id: typeof SERVICE_NAME | (string & {}),
    props: YourServiceStackProps
  ) {
    super(scope, id, props);
    // Implementation
  }
}
```

### 2. Infrastructure and Runtime Code Separation

Maintain strict separation between infrastructure and runtime code:

```
services/[service-name]/
├── src/
│   ├── index.ts              # Main stack definition
│   ├── service-name.ts       # Service name constant
│   ├── infra/                # Infrastructure-only code
│   │   ├── functions/        # Lambda construct definitions
│   │   ├── buckets/          # S3 bucket constructs
│   │   ├── step-functions/   # Step Function definitions (YAML)
│   │   └── environment/      # Environment parameters
│   └── runtime/              # Runtime-only code
│       ├── handlers/         # Lambda handler implementations
│       └── lib/              # Shared runtime utilities
└── tests/                    # Test files
```

#### Key Separation Rules:

- **Infra code**: CDK constructs, resource definitions, configuration
- **Runtime code**: Lambda handlers, business logic, utilities
- **No mixing**: Runtime code cannot import from infra, and vice versa
- **Asset resolution**: Use `resolveAssetPath()` to reference runtime assets from infra

### 3. Default Constructs and Utilities

#### LambdaFunction Construct

Use the standardized `LambdaFunction` construct from `@libs/cdk-utils`:

```typescript
import { LambdaFunction } from '@libs/cdk-utils/infra';

const myFunction = new LambdaFunction(this, 'MyFunction', {
  entry: resolveAssetPath('runtime/handlers/my-handler.ts'),
  environment: {
    DATA_BUCKET: bucket.bucketName,
  },
});
```

**Benefits:**

- Stage-aware bundling optimizations
- Automatic log group creation with appropriate retention
- Environment variable management
- Source map support for debugging

#### Step Functions

Use `StepFunctionFromFile` for YAML-based definitions:

```typescript
import { StepFunctionFromFile } from '@libs/cdk-utils/infra';

const stepFunction = new StepFunctionFromFile(this, 'ProcessWorkflow', {
  filepath: resolveAssetPath('infra/step-functions/process-workflow.asl.yaml'),
  lambdaFunctions: [functionA, functionB, functionC], // Automatic ARN resolution
});
```

#### S3 Buckets

Use specialized bucket constructs:

```typescript
import { TemporaryDataBucket, ConfigBucket } from '@libs/cdk-utils/infra';

// For short-lived data with automatic lifecycle policies
const dataBucket = new TemporaryDataBucket(this, 'DataBucket');

// For configuration and long-term storage
const configBucket = new ConfigBucket(this, 'ConfigBucket');
```

#### SSM Parameters

Use parameter groups for organized credential management:

```typescript
import { SsmParameterGroup } from '@libs/cdk-utils/infra';

class MyServiceParameters extends SsmParameterGroup {
  public readonly parameters = {
    API_KEY: StringParameter.fromStringParameterName(this, 'ApiKey', `/company/my-service/api-key`),
  } as const;
}

// Grant permissions to functions
const parameters = new MyServiceParameters(this);
parameters.grantToFunction(myFunction, 'read');
```

### 4. Asset Resolution and Service Naming

#### Service Name Pattern

Each service must have a `service-name.ts` file:

```typescript
/**
 * Service name constant for your-service
 *
 * This constant is used throughout the service for:
 * - Stack identification and naming
 * - Resource tagging
 * - Logging context
 * - Service discovery
 */
export const SERVICE_NAME = 'your-service' as const;
```

#### Asset Path Resolution

Use the standardized `resolveAssetPath` function:

```typescript
export function resolveAssetPath(assetPath: `${'runtime/' | 'infra/'}${string}`) {
  return path.resolve(import.meta.dirname, assetPath);
}
```

**Usage examples:**

- Lambda handlers: `resolveAssetPath('runtime/handlers/my-handler.ts')`
- Step Function definitions: `resolveAssetPath('infra/step-functions/workflow.asl.yaml')`
- Configuration files: `resolveAssetPath('infra/config/mapping.json')`

## Service Organization Patterns

### Lambda Function Organization

#### For services with multiple functions:

```typescript
// services/your-service/src/infra/functions/lambda-functions.ts
export class LambdaFunctions extends Construct {
  public readonly functionA: LambdaFunction;
  public readonly functionB: LambdaFunction;

  constructor(scope: Construct, id: string, props?: LambdaFunctionsProps) {
    super(scope, id);

    this.functionA = new LambdaFunction(this, 'FunctionA', {
      entry: resolveAssetPath('runtime/handlers/function-a.ts'),
      environment: props?.commonEnvironment,
    });

    this.functionB = new LambdaFunction(this, 'FunctionB', {
      entry: resolveAssetPath('runtime/handlers/function-b.ts'),
      environment: props?.commonEnvironment,
    });
  }
}
```

#### Environment Variable Strategy:

- **6+ functions**: Use `commonEnvironment` pattern
- **< 6 functions**: Assign individually for clarity

### Common Service Patterns

#### Scheduled Integration Service

```typescript
// EventBridge rule triggering Step Function
new Rule(this, 'ProcessSchedule', {
  schedule: Schedule.cron({ hour: '*/6', minute: '0' }),
  targets: [new SfnStateMachine(processWorkflow)],
});
```

#### API-Driven Service

```typescript
// API Gateway + SQS + Step Function pattern
const api = new HttpApi(this, 'Api', {
  corsPreflight: {
    allowMethods: [CorsHttpMethod.POST],
    allowOrigins: ['*'],
  },
});

const queue = new Queue(this, 'ProcessingQueue', {
  queueName: `${SERVICE_NAME}-processing`,
});

api.addRoutes({
  path: '/process',
  methods: [HttpMethod.POST],
  integration: new HttpLambdaIntegration('ProcessIntegration', processFunction),
});
```

#### Event-Driven Service

```typescript
// S3 event to SQS to Lambda pattern
bucket.addEventNotification(EventType.OBJECT_CREATED, new SqsDestination(processQueue));

processFunction.addEventSource(new SqsEventSource(processQueue));
```

## Best Practices

### Resource Naming

- Use CDK's automatic naming instead of explicit names
- Tag resources with service name: `Tags.of(this).add('SERVICE', SERVICE_NAME)`
- Use consistent construct IDs across services

### Environment Management

- Development: Optimized for debugging and fast iteration
- Staging: Production-like with enhanced logging
- Production: Optimized for performance and cost

### Error Handling

- Use dead letter queues for SQS processing
- Implement retry logic in Step Functions
- Use SNS topics for error notifications

### Security

- Grant minimal required permissions
- Use SSM parameters for sensitive data
- Never commit secrets to the repository

### Testing

- Use `MicroserviceChecks` aspect for CDK validation
- Test environment variable utilities
- Use CDK Template assertions for infrastructure tests

## Common Patterns Reference

### EventBridge Scheduling

```typescript
// Common schedule patterns
Schedule.cron({ minute: '0' }); // Every hour
Schedule.cron({ hour: '*/6', minute: '0' }); // Every 6 hours
Schedule.cron({ minute: '*/5' }); // Every 5 minutes
Schedule.cron({ hour: '0', minute: '0' }); // Daily at midnight
```

### Environment Variable Management

```typescript
import { pickFromProcessEnv, type Keys } from '@libs/cdk-utils/runtime';
// SSM Parameter Group construct - important to only import the *type*
import type { MySsmParameters } from './my-ssm-parameters';

// Union of keys
type ServiceKeys = 'STAGE' | 'DATA_BUCKET';

// Environment object
interface ServiceEnvironment {
  DATA_BUCKET: string;
  API_ENDPOINT: string;
}

// Export the generic function with allowed keys specific to this service
export function getServiceEnv = pickFromProcessEnv<
    | ServiceKeys
    | keyof ServiceEnvironment
    | Keys<MySsmParameters>
  >;
```

### Testing Patterns

```typescript
// CDK stack testing
import { MicroserviceChecks } from '@libs/cdk-utils/infra';

let stack: Stack;
let template: Template;

beforeEach(() => {
  const app = new App();
  stack = new YourServiceStack(app, 'TestStack', { description: 'Test' });
  Aspects.of(stack).add(new MicroserviceChecks());
  template = Template.fromStack(stack);
});
```

This architecture ensures consistency, maintainability, and scalability across all microservices in the monorepo while providing clear guidelines for developers.
