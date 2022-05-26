import 'source-map-support/register';

// AWSLambda.Handler is provides very generic typing
// for handler functions. Specific argument and output
// types can be supplied using generic arguments
// e.g. AWSLambda.Handler<string, object>, and/or using
// event-specific handler types e.g. AWSLambda.S3Handler
export const handler: AWSLambda.Handler = async (event, context) => {
    console.log('Hello');
    // Cloudwatch logs display objects more cleanly if
    // they are sent as JSON strings
    console.log('Lambda event: ', JSON.stringify(event))
    console.log('Lambda context: ', JSON.stringify(context))
    return {};
};
