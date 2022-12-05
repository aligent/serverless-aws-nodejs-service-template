import AWS from 'aws-sdk';

const SSM = new AWS.SSM();

interface ParameterValues {
    [key: string]: string;
}

export async function getParemetersFromSsm<T extends string>(
    path: string, // Path of SSM paramters
    parameterNames: string[] // Name within the specified path
) {
    const paramsWithPath = parameterNames.map((name) => path + name);

    const params: AWS.SSM.GetParametersRequest = {
        Names: paramsWithPath,
        WithDecryption: true,
    };

    console.log(`Getting Parameters from SSM: ${JSON.stringify(params)}`);

    const ssmParameterList = await SSM.getParameters(params).promise();

    if (ssmParameterList.Parameters?.length !== parameterNames.length) {
        throw 'SSM parameters not found for all inputs';
    }

    const parameterSet: ParameterValues = {};

    for (const parameter of parameterNames) {
        parameterSet[parameter] = ssmParameterList.Parameters.filter(
            (ssmParameter) => ssmParameter.Name === path + parameter
        )[0].Value as string;
    }

    return parameterSet as Record<T, string>;
}

export const sendParameterToSsm = async (
    parameterName: string,
    parameterValue: string
) => {
    const params: AWS.SSM.PutParameterRequest = {
        Name: parameterName,
        Value: parameterValue,
    };

    console.log(`Sending parameter ${parameterName} to SSM`);

    return await SSM.putParameter(params).promise();
};
