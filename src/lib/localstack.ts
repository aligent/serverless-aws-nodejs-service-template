import { S3, Lambda, DynamoDB } from 'aws-sdk';

const endpoint = process.env.LOCALSTACK_HOSTNAME
    ? `http://${process.env.LOCALSTACK_HOSTNAME}:4566`
    : process.env.AWS_LOCALSTACK
    ? `http://${process.env.AWS_LOCALSTACK}:4566`
    : '';

const credentials = {
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
};

export const S3Params: S3.Types.ClientConfiguration =
    process.env.LOCALSTACK_HOSTNAME || process.env.AWS_LOCALSTACK
        ? {
              credentials,
              endpoint,
              s3ForcePathStyle: true,
          }
        : {};

export const DynamoDBParams: DynamoDB.Types.ClientConfiguration =
    process.env.LOCALSTACK_HOSTNAME || process.env.AWS_LOCALSTACK
        ? {
              credentials,
              endpoint,
          }
        : {};

export const LambdaParams: Lambda.Types.ClientConfiguration =
    process.env.LOCALSTACK_HOSTNAME || process.env.AWS_LOCALSTACK
        ? {
              credentials,
              endpoint,
          }
        : {};
