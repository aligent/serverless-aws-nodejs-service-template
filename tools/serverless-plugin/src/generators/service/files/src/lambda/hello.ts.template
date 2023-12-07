/* v8 ignore start */

// You can deconstruct modules to import a specific type
// AWSLambda.Handler provides generic typing
// for handler functions. Specific argument and output
// types can be supplied using generic arguments
// e.g. AWSLambda.Handler<string, object>, or you can use
// event-specific handler types e.g. AWSLambda.S3Handler
import type { Handler } from 'aws-lambda/handler';

export const handler: Handler = async (event, context) => {
    const message = 'Hello';
    console.log(message);
    // Cloudwatch logs display objects more cleanly if
    // they are sent as JSON strings
    console.log('Lambda event: ', JSON.stringify(event));
    console.log('Lambda context: ', JSON.stringify(context));
    return {};
};
