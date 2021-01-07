import { S3, Lambda, DynamoDB } from "aws-sdk";

export const UseAWSLocal: boolean = (process.env.IS_LOCAL || process.env.IS_OFFLINE) === 'true';

export const S3Params : S3.Types.ClientConfiguration = UseAWSLocal ? {
    accessKeyId: 'S3RVER', // This specific key is required when working offline
    secretAccessKey: 'S3RVER',
    endpoint: 'http://localhost:8888',
    s3ForcePathStyle: true
} : {};

export const DynamoDBParams : DynamoDB.Types.ClientConfiguration = UseAWSLocal ? {
    region: 'localhost',
    endpoint: 'http://localhost:3003'
} : {};

export const LambdaParams : Lambda.Types.ClientConfiguration = UseAWSLocal ? {
    endpoint: 'http://localhost:3002'
} : {};
