// Util has been started - purely for testing of the monorepo - Remainder of util to be completed in MICRO-52

import AWS from 'aws-sdk';

const DynamoDB = new AWS.DynamoDB();

export const scanItems = (
    TableName: string,
    Limit?: number,
    ExclusiveStartKey?: AWS.DynamoDB.Key
) => {
    const params: AWS.DynamoDB.ScanInput = {
        TableName,
        Limit,
        ExclusiveStartKey,
    };

    console.log(
        `Scanning items from dynamo using params: ${JSON.stringify(params)}`
    );

    return DynamoDB.scan(params).promise();
};

export const getItem = (Key: AWS.DynamoDB.Key, TableName: string) => {
    const params: AWS.DynamoDB.GetItemInput = {
        TableName,
        Key,
    };

    console.log(
        `Getting item from dynamo using params: ${JSON.stringify(params)}`
    );

    return DynamoDB.getItem(params).promise();
};

export const emptyDynamoTable = async (TableName: string) => {
    const params: AWS.DynamoDB.ScanInput = {
        TableName,
    };
    const existingDynamoEntries = await DynamoDB.scan(params).promise();

    console.log(
        `Deleting existing entries: 
        ${JSON.stringify(existingDynamoEntries)}`
    );

    for (const existingEntry of existingDynamoEntries.Items) {
        const params: AWS.DynamoDB.DeleteItemInput = {
            TableName: process.env.productTable,
            Key: { productId: existingEntry.productId },
        };

        await DynamoDB.deleteItem(params).promise();
    }
};

export const bulkItemUpload = async (
    items: AWS.DynamoDB.PutItemInputAttributeMap[],
    TableName: string
) => {
    for (const item of items) {
        const params: AWS.DynamoDB.PutItemInput = {
            TableName,
            Item: item,
        };

        console.log(
            `Putting item into dynamo using params: ${JSON.stringify(params)}`
        );

        await DynamoDB.putItem(params).promise();
    }
};
