import { StepFunctionFromFile } from '@aligent/cdk-utils';
import { RemovalPolicy, Stack, StackProps, Tags } from 'aws-cdk-lib';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import path from 'node:path';

export interface CdkServiceStackProps extends StackProps {
    /**
     * Whether to use legacy naming conventions for resources.
     * When true, resources will be named using the pattern: ${serviceId}-${stageName}-${resourceName}
     * @default false - for new services
     */
    useLegacyNaming?: boolean;
}

export class CdkServiceStack extends Stack {
    constructor(scope: Construct, id: string, props?: CdkServiceStackProps) {
        super(scope, id, props);

        const configBucket = new Bucket(this, 'configBucket', {
            versioned: true,
            autoDeleteObjects: true,
            removalPolicy: RemovalPolicy.DESTROY,
        });

        const cacheTable = new Table(this, 'cacheTable', {
            partitionKey: { name: 'id', type: AttributeType.STRING },
            removalPolicy: RemovalPolicy.DESTROY,
        });

        const randomNumberSfn = new StepFunctionFromFile(this, 'randomNumber', {
            filepath: path.join(__dirname, 'step-functions/random-number-machine.asl.yaml'),
            definitionSubstitutions: {
                configBucketName: configBucket.bucketName,
                configFileName: this.node.tryGetContext('configFileName'),
                cacheTableName: cacheTable.tableName,
            },
        });

        configBucket.grantRead(randomNumberSfn);
        cacheTable.grantWriteData(randomNumberSfn);

        Tags.of(this).add('SERVICE', id);
    }
}
