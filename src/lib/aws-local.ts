import { S3, Lambda } from "aws-sdk";

export const UseAWSLocal: boolean = (process.env.IS_LOCAL || process.env.IS_OFFLINE) === 'true';

export const S3Params : S3.Types.ClientConfiguration = UseAWSLocal ? {
    accessKeyId: 'S3RVER', // This specific key is required when working offline
    secretAccessKey: 'S3RVER',
    endpoint: 'http://localhost:8888',
    s3ForcePathStyle: true
} : {};

export const LambdaParams : Lambda.Types.ClientConfiguration = UseAWSLocal ? {
    endpoint: 'http://localhost:3002'
} : {};
