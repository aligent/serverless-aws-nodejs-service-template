import { DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import { S3ClientConfig } from '@aws-sdk/client-s3';
import { SSMClientConfig } from '@aws-sdk/client-ssm';

const endpoint = process.env.AWS_LOCALSTACK
    ? `http://${process.env.AWS_LOCALSTACK}:4566`
    : null;

const credentials = {
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
};

const region = process.env.AWS_REGION || 'ap-southeast-2';

export const ssmConfig: SSMClientConfig = endpoint
    ? {
          credentials,
          endpoint,
          region,
      }
    : {};

export const s3Config: S3ClientConfig = endpoint
    ? {
          credentials,
          endpoint,
          forcePathStyle: true,
          region,
      }
    : {};

export const dynamoDbConfig: DynamoDBClientConfig = endpoint
    ? {
          credentials,
          endpoint,
          region,
      }
    : {};
