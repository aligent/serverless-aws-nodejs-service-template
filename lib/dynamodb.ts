// Util has been started - purely for testing of the monorepo - Remainder of util to be completed in MICRO-52

import AWS from 'aws-sdk';

const DynamoDB = new AWS.DynamoDB();
const BATCH_SIZE = 25;

/* Scan Items input:
TableName - Name of the table
Limit - How many items you want to fetch in the scan
ExclusiveStartKey - When using a limit this will be the id of the 'last' item in the previous call
*/
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

/* Get Item input:
TableName - Name of the table
Key - The primary key of the item you are trying to receive
*/
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

/* Get Item input:
TableName - Name of the table
Key - The primary key of the item you are trying to receive
*/
export const queryItems = (params: AWS.DynamoDB.QueryInput) => {
    console.log(
        `Querying items from dynamo using params: ${JSON.stringify(params)}`
    );

    return DynamoDB.query(params).promise();
};

/* Empty Table
This should not regularly be used. It may be required to refresh a table in staging though
Input:
TableName - Name of the table
*/
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

/* Put Item 
Note - This will replace an existing entry if one exists. Unless sending
full item do not use this for updating
Input:
TableName - Name of the table
Item - Dynamo Structured attribute map.
e.g.
{ 
    productId: { S: 'hello' },
    price: { N: 19.95 },
    available: { BOOL: true }
}
*/
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

/* Update Item 
Note - This will update the attributes you pass in. If there were already other
attributes against the item they will persist
Input:
TableName - Name of the table
Key - The primary key of the item you are trying to update
updates - Attribute Map of what you are trying to add to the item
e.g.
{ 
    salePrice: { N: 15.95 },
    colour: { S: 'Purple' },
    size: { S: '12' }
}
*/
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

/* Batch Write Items
Bulk writes items to dynamo db in batches of 25 items.
Input:
TableName - Name of the table
Items - Array of items to be sent to dynamo - see putItem for details item structure
index - Do not pass a value in for this. Its used for batching
*/
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
        await batchWriteItems(tableName, items, index + BATCH_SIZE);
    }

    return true;
};
