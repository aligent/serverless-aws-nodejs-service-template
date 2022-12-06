import 'source-map-support/register';
import {
    batchWriteItems,
    emptyDynamoTable,
    getItem,
    putDynamoItem,
    scanItems,
    updateDynamoItem,
} from '../../../../lib/dynamodb';

const PRODUCT_TABLE = process.env.productTable;
const HELLO_ITEM = { productId: { S: 'hello' } };
const WORLD_ITEM = { productId: { S: 'world' } };

export const handler: AWSLambda.Handler = async () => {
    console.log('Hello, I am testing the shared dynamo table');

    if (!PRODUCT_TABLE) {
        throw 'No table name available';
    }

    await scanItems(PRODUCT_TABLE);

    await getItem(HELLO_ITEM, PRODUCT_TABLE);

    await emptyDynamoTable(PRODUCT_TABLE);

    await putDynamoItem(PRODUCT_TABLE, HELLO_ITEM);

    await updateDynamoItem(PRODUCT_TABLE, HELLO_ITEM, {
        test: { S: 'update value' },
    });

    await batchWriteItems(PRODUCT_TABLE, [WORLD_ITEM]);
};
