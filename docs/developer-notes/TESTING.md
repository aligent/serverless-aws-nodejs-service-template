# Testing Philosophy

## Lambda Handler Testing Strategy

### Core Principle: Thin Handlers

Lambda handlers should be treated as orchestration layers, not business logic containers. We **DO NOT** unit test Lambda handlers directly. Instead:

1. **Handlers should only:**
   - Accept and validate input
   - Call unit-tested functions
   - Handle I/O operations (S3, API calls, etc.)
   - Return properly formatted responses
   - Add observability (logging, metrics, tracing)

2. **Business logic belongs in:**
   - Pure functions that are easily testable
   - Service classes with mockable dependencies
   - Utility libraries with clear interfaces

### Example: Refactoring for Testability

#### ❌ Bad: Business Logic in Handler

```typescript
// handlers/process-data.ts
export const handler = async event => {
  const data = await s3.fetchData(event.key);

  // Business logic embedded in handler
  const processed = data.map(item => {
    const tax = item.price * 0.1;
    const shipping = item.weight > 5 ? 15 : 10;
    return {
      ...item,
      total: item.price + tax + shipping,
      taxAmount: tax,
      shippingCost: shipping,
    };
  });

  return await s3.storeData(processed);
};
```

#### ✅ Good: Testable Business Logic

```typescript
// lib/pricing-calculator.ts
export interface PricingOptions {
  taxRate: number;
  heavyItemThreshold: number;
  heavyShippingCost: number;
  standardShippingCost: number;
}

export function calculatePricing(items: Item[], options: PricingOptions): ProcessedItem[] {
  return items.map(item => {
    const tax = item.price * options.taxRate;
    const shipping =
      item.weight > options.heavyItemThreshold
        ? options.heavyShippingCost
        : options.standardShippingCost;

    return {
      ...item,
      total: item.price + tax + shipping,
      taxAmount: tax,
      shippingCost: shipping,
    };
  });
}

// lib/pricing-calculator.test.ts
describe('calculatePricing', () => {
  it('should calculate standard shipping for light items', () => {
    const items = [{ price: 100, weight: 3 }];
    const options = {
      taxRate: 0.1,
      heavyItemThreshold: 5,
      heavyShippingCost: 15,
      standardShippingCost: 10,
    };

    const result = calculatePricing(items, options);

    expect(result[0].shippingCost).toBe(10);
    expect(result[0].total).toBe(120); // 100 + 10 tax + 10 shipping
  });
});

// handlers/process-data.ts
import { calculatePricing } from '../lib/pricing-calculator';

export const handler = async (event, context) => {
  logger.addContext(context);
  logger.info('Processing pricing data', { key: event.key });

  const data = await s3.fetchData<Item[]>(event.key);

  const processed = calculatePricing(data, {
    taxRate: 0.1,
    heavyItemThreshold: 5,
    heavyShippingCost: 15,
    standardShippingCost: 10,
  });

  const result = await s3.storeData(processed);
  logger.info('Stored processed data', { key: result.Key });

  return result;
};
```

### Integration Testing

While we don't unit test handlers, integration tests are valuable for:

- Testing the complete flow through AWS services
- Validating IAM permissions
- Ensuring proper error handling
- Testing timeouts and retries

See [Integration Testing Guide](#integration-testing-guide) below.

## Integration Testing Guide

### Step Function Integration Tests

Integration tests for Step Functions validate the entire workflow and state transitions.

#### Example: Step Function Integration Test

```typescript
// tests/integration/process-shipments.integration.test.ts
import { SFNClient, StartExecutionCommand, DescribeExecutionCommand } from '@aws-sdk/client-sfn';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

const sfnClient = new SFNClient({ region: 'us-east-1' });
const s3Client = new S3Client({ region: 'us-east-1' });

describe('Process Shipments Step Function Integration', () => {
  const stateMachineArn = process.env.STATE_MACHINE_ARN;
  const testBucket = process.env.TEST_BUCKET;

  it('should process shipments end-to-end', async () => {
    // Arrange: Set up test data
    const testData = [
      { Sku: 'TEST-001', Total: '10', MinDate: '2024-01-01' },
      { Sku: 'TEST-002', Total: '20', MinDate: '2024-01-02' },
    ];

    await s3Client.send(
      new PutObjectCommand({
        Bucket: testBucket,
        Key: 'test-input.json',
        Body: JSON.stringify(testData),
      })
    );

    // Act: Execute the step function
    const execution = await sfnClient.send(
      new StartExecutionCommand({
        stateMachineArn,
        input: JSON.stringify({
          bucket: testBucket,
          key: 'test-input.json',
        }),
      })
    );

    // Wait for completion
    let status = 'RUNNING';
    while (status === 'RUNNING') {
      const description = await sfnClient.send(
        new DescribeExecutionCommand({
          executionArn: execution.executionArn,
        })
      );
      status = description.status;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Assert: Verify the output
    expect(status).toBe('SUCCEEDED');

    const output = await s3Client.send(
      new GetObjectCommand({
        Bucket: testBucket,
        Key: 'processed-output.json',
      })
    );

    const processedData = JSON.parse(await output.Body.transformToString());
    expect(processedData).toHaveLength(2);
    expect(processedData[0]).toHaveProperty('eta');
  });

  it('should handle empty input gracefully', async () => {
    // Test with empty array
    await s3Client.send(
      new PutObjectCommand({
        Bucket: testBucket,
        Key: 'empty-input.json',
        Body: JSON.stringify([]),
      })
    );

    const execution = await sfnClient.send(
      new StartExecutionCommand({
        stateMachineArn,
        input: JSON.stringify({
          bucket: testBucket,
          key: 'empty-input.json',
        }),
      })
    );

    // Verify it completes successfully even with no data
    // ... assertion logic
  });
});
```

### Local Testing with SAM or LocalStack

For faster feedback loops, consider using AWS SAM or LocalStack:

#### SAM Local Example

```yaml
# template.yaml for local testing
Resources:
  ProcessShipmentsFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: ./dist
      Handler: handlers/process-shipments.handler
      Runtime: nodejs18.x
      Environment:
        Variables:
          DATA_BUCKET: !Ref DataBucket
```

```bash
# Run locally
sam local start-lambda
sam local invoke ProcessShipmentsFunction --event test-event.json
```

#### LocalStack Example

```typescript
// tests/integration/localstack.config.ts
export const localStackConfig = {
  services: ['s3', 'lambda', 'stepfunctions'],
  region: 'us-east-1',
  lambdaExecutor: 'docker',
  environmentVariables: {
    DATA_BUCKET: 'test-bucket',
    AWS_ENDPOINT_URL: 'http://localhost:4566',
  },
};
```

## Testing Best Practices

1. **Separate Concerns**: Keep business logic in pure functions
2. **Mock External Services**: Use AWS SDK mocks for unit tests
3. **Test Data Builders**: Create factories for test data
4. **Error Scenarios**: Test both happy paths and error cases
5. **Performance Tests**: Monitor Lambda cold starts and execution times
6. **Contract Testing**: Validate API contracts between services

## Recommended Testing Tools

- **Unit Tests**: Vitest (already configured)
- **AWS Service Mocks**: `aws-sdk-client-mock`
- **Integration Tests**: Real AWS services or LocalStack
- **Load Testing**: Artillery or k6
- **Contract Testing**: Pact or OpenAPI validation

## Running Tests

```bash
# Unit tests only
yarn test

# Integration tests (requires AWS credentials)
yarn test:integration

# All tests with coverage
yarn test:all --coverage
```
