// Util has been started - purely for testing of the monorepo - Remainder of util to be completed in MICRO-52

import AWS from 'aws-sdk';

const DynamoDB = new AWS.DynamoDB();
const BATCH_SIZE = 25;

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
            TableName,
            Key: { productId: existingEntry.productId },
        };

        await DynamoDB.deleteItem(params).promise();
    }
};

export const putDynamoItem = (
    TableName: string,
    Item: AWS.DynamoDB.PutItemInputAttributeMap
) => {
    const params: AWS.DynamoDB.PutItemInput = {
        TableName,
        Item,
    };

    console.log(
        `Putting item in dynamo using params: ${JSON.stringify(params)}`
    );

    return DynamoDB.putItem(params).promise();
};

export const updateDynamoItem = (
    TableName: string,
    Key: AWS.DynamoDB.Key,
    updates: AWS.DynamoDB.AttributeMap
) => {
    const updateExpression = Object.keys(updates)
        .map((attribtue) => `${attribtue} = :${attribtue}`)
        .join(', ');

    const expressionAttributeValues: Record<string, unknown> = Object.keys(
        updates
    ).reduce(
        (values: { [key: string]: AWS.DynamoDB.AttributeValue }, attribute) => {
            values[`:${attribute}` as keyof typeof values] = updates[attribute];
            return values;
        },
        {}
    );

    const params: AWS.DynamoDB.UpdateItemInput = {
        TableName,
        Key,
        UpdateExpression: `set ${updateExpression}`,
        ExpressionAttributeValues: expressionAttributeValues,
    };

    console.log(
        `Updating item in dynamo using params: ${JSON.stringify(params)}`
    );

    return DynamoDB.updateItem(params).promise();
};

export const batchWriteItems = async (
    tableName: string,
    items: AWS.DynamoDB.ItemList,
    index = 0
): Promise<boolean> => {
    const batch = items.slice(index, BATCH_SIZE);

    const params: AWS.DynamoDB.BatchWriteItemInput = {
        RequestItems: {
            [tableName]: batch.map((item) => ({
                PutRequest: {
                    Item: item,
                },
            })),
        },
    };

    console.log(
        `Batch write into dynamo using params: ${JSON.stringify(params)}`
    );

    await DynamoDB.batchWriteItem(params).promise();

    if (index + BATCH_SIZE < items.length) {
        batchWriteItems(tableName, items, index + BATCH_SIZE);
    }

    return true;
};
