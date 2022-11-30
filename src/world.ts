import axios from 'axios';
import { getConfigurations } from './lib/collect-ssm-params';

// AWSLambda.Handler is provides very generic typing
// for handler functions. Specific argument and output
// types can be supplied using generic arguments
// e.g. AWSLambda.Handler<string, object>, and/or using
// event-specific handler types e.g. AWSLambda.S3Handler
export const handler: AWSLambda.Handler = async (event, context) => {
    const params = ['param3', 'param4'] as const;
    const configs = await getConfigurations<typeof params[number]>('', params);
    console.log(
        'You should not print secret out in production but this is just an example.'
    );
    console.log('Your SSM parameters:', JSON.stringify(configs));

    const ipAddress = await (
        await axios.get('http://checkip.amazonaws.com')
    ).data.trim();

    console.log('Your IP:', ipAddress);

    return {
        statusCode: 200,
        body: JSON.stringify({
            ipAddress,
            status: true,
        }),
    };
};
