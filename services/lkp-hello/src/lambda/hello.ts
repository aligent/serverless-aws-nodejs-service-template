import 'source-map-support/register';
import { getItem, scanItems } from '../../../../lib/dynamodb';

const PRODUCT_TABLE = process.env.productTable;

// AWSLambda.Handler is provides very generic typing
// for handler functions. Specific argument and output
// types can be supplied using generic arguments
// e.g. AWSLambda.Handler<string, object>, and/or using
// event-specific handler types e.g. AWSLambda.S3Handler
export const handler: AWSLambda.Handler = async (event, context) => {
    console.log('Hello, getting item from shared dynamo table');

    if (!PRODUCT_TABLE) {
        throw 'No table name available';
    }

    console.log(`Importer product table: ${JSON.stringify(PRODUCT_TABLE)}`);

    const scannedItems = await scanItems(PRODUCT_TABLE);

    console.log(`Scanned Table: ${JSON.stringify(scannedItems)}`);

    const helloDynamoItem = await getItem(
        { productId: { S: 'hello' } },
        PRODUCT_TABLE
    );

    console.log(`dynamo item:: ${JSON.stringify(helloDynamoItem)}`);

    // Cloudwatch logs display objects more cleanly if
    // they are sent as JSON strings
    console.log('Lambda event: ', JSON.stringify(event));
    console.log('Lambda context: ', JSON.stringify(context));
    return {};
};
