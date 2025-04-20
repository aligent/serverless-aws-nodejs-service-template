# <%= name %>

This is a serverless notification system built using AWS Lambda and Amazon SNS. It allows you to send notifications to various channels such as email, Slack or even mobile push notification.

## Architecture

![Architecture Diagram](docs/architecture-diagram.svg)

The system consists of the following components:

1. AWS Lambda: A Lambda function is responsible for processing the notification requests and publishing messages to an SNS topic.
2. Amazon SNS: An SNS topic is used to distribute the notification messages to different channels (email, SMS, mobile push, etc.) based on subscriptions.
3. Subscribers: Various services or applications can subscribe to the SNS topic to receive notifications. For example, an email service can subscribe to receive email notifications, and `AWS Chatbot` service can subscribe to receive notifications and forward to Slack.

## Setup

- When posting to Slack, due to security restrictions, we do not deploy Amazon SNS & subscribe it ourselves. We will need to ask DevOps to set it up. As a result, we import the SNS arn via SSM.
- This service has 2 dependencies, we need to install them like so:
  ```bash
    npm install @aws-sdk/client-sns dayjs
  ```
- This service exports a Lambda Arn named as the endpoint for receiving notification. Other services can import it by: `!ImportValue: ErrorNotificationLambdaFunction-${self:provider.stage}`
- Since other services depends on this service exported value, we will need to tell Nx about this dependency by adding `implicitDependencies` & `dependsOn` to the service `project.json` like so:

```json
{
  "name": "service-name",
  "implicitDependencies": ["notification"], // For `nx graph` only
  "targets": {
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "cwd": "services/service-name",
        "color": true,
        "command": "sls package"
      },
      "dependsOn": [{ "projects": ["notification"], "target": "build", "params": "forward" }]
    },
    "deploy": {
      "executor": "nx:run-commands",
      "options": {
        "cwd": "services/service-name",
        "color": true,
        "command": "sls deploy"
      },
      "dependsOn": [{ "projects": ["notification"], "target": "deploy", "params": "forward" }]
    }
  }
}
```

## Usage

This service accepts events in the following format (similar to CloudWatch Event events):

```json
{
  "id": "00acdcb8-8864-405f-af3d-51a6bfb2d151",
  "detail-type": "Lambda Execution Failed",
  "source": "aws.lambda",
  "time": "2024-06-24T04:42:33.884Z",
  "region": "ap-southeast-2",
  "resources": [
    "arn:aws:lambda:ap-southeast-2:XXXXXXXXXX:function:client-int-service-name-stg-lambdaName"
  ],
  "detail": {
    "executionArn": "arn:aws:lambda:ap-southeast-2:XXXXXXXXXX:function:client-int-service-name-stg-lambdaName",
    "logGroupName": "/aws/lambda/client-int-service-name-stg-lambdaName",
    "name": "client-int-service-name-stg-lambdaName",
    "status": "FAILED",
    "error": "SyntaxError",
    "cause": "{\"errorType\":\"SyntaxError\",\"errorMessage\":\"Unexpected token u in JSON at position 0\",\"trace\":\"SyntaxError: Unexpected token u in JSON at position 0\\n    at JSON.parse (<anonymous>)\\n    at Runtime.V1 (/src/lambda/create-order.ts:39:34)\\n    at Runtime.handleOnceNonStreaming (file:///var/runtime/index.mjs:1173:29)\"}"
  }
}
```

The Lambda function will process the payload, format the notification message, and publish it to the SNS topic. The subscribed services will then receive the notification and handle it accordingly.

### Working with StepFunction

The `serverless-step-functions` plugin supports CloudWatch Event notifications. Therefore, we only need to add the following `notifications` configure:

```yaml
stepFunctions:
  validate: true
  stateMachines:
    stateMachineName:
      name: ${self:service}-${self:provider.stage}-stateMachineName
      notifications:
        ABORTED:
          - lambda: arn:aws:lambda:${aws:region}:${aws:accountId}:function:tt-int-notification-${self:provider.stage}-notifyError
        FAILED:
          - lambda: arn:aws:lambda:${aws:region}:${aws:accountId}:function:tt-int-notification-${self:provider.stage}-notifyError
        TIMED_OUT:
          - lambda: arn:aws:lambda:${aws:region}:${aws:accountId}:function:tt-int-notification-${self:provider.stage}-notifyError
```

**_Note_**: It's unfortunate that `serverless-step-functions` does not support `!ImportValue`. Therefore, we have to manually build the notification arn.

### Working with Lambda

To send message to this notification service, we need to invoke the exported Lambda endpoint by [AWS SDK](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/lambda/command/InvokeCommand/).

For that reason, we need to update the `serverless.yml` file to include necessary permissions like so:

```yaml
provider:
  iam:
    role:
      statements:
        - Effect: Allow
          Action:
            - lambda:InvokeFunction
          Resource: !ImportValue ErrorNotificationLambdaFunction-${self:provider.stage}
  environment:
    ERROR_NOTIFICATION_LAMBDA_ARN: !ImportValue ErrorNotificationLambdaFunction-${self:provider.stage}
```

Below is an example of how this service can be invoked:

```typescript
async notifyError(error: Error, context: Context) {
        const payload = {
            id: context.awsRequestId,
            'detail-type': 'Lambda Execution Failed',
            source: 'aws.lambda',
            time: new Date().toISOString(),
            region: context.invokedFunctionArn.split(':')[3] as string,
            resources: [context.invokedFunctionArn],
            detail: {
                executionArn: context.invokedFunctionArn,
                logGroupName: context.logGroupName,
                name: context.functionName,
                status: 'FAILED',
                error: error.name,
                cause: JSON.stringify({
                    errorType: error.name,
                    errorMessage: error.message,
                    trace: error.stack,
                }),
            },
        };

        const input: InvokeCommandInput = {
            FunctionName: process.env.ERROR_NOTIFICATION_LAMBDA_ARN,
            InvocationType: 'Event',
            Payload: payload,
        };

        const response = await this.client.send(new InvokeCommand(input));

        console.log('Error notification sent:', JSON.stringify(response));

        return response;
    }
```
