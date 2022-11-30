import {
    GetParameterCommand,
    GetParametersByPathCommand,
    Parameter,
    SSMClient,
} from '@aws-sdk/client-ssm';
import { ssmConfig } from './aws-configs';

const ssmClient = new SSMClient(ssmConfig);

export const getSingleParameterByPathName = async (ssmPathName: string) => {
    const command = new GetParameterCommand({
        Name: ssmPathName,
        WithDecryption: true,
    });

    return (await ssmClient.send(command)).Parameter?.Value;
};

export const getParametersByPath = async (
    ssmFullPath: string,
    nextToken: string = null,
    parameters: Parameter[] = []
): Promise<Parameter[]> => {
    const command = new GetParametersByPathCommand({
        Path: ssmFullPath,
        Recursive: true,
        WithDecryption: true,
        MaxResults: 2,
        NextToken: nextToken,
    });

    try {
        const { Parameters, NextToken } = await ssmClient.send(command);
        const newParams = parameters.concat(Parameters);

        return NextToken
            ? getParametersByPath(ssmFullPath, NextToken, newParams)
            : newParams;
    } catch (error) {
        console.error(
            `Unable to get SSM Parameters for ${JSON.stringify(
                command.input
            )}.`,
            error.toString()
        );

        throw error;
    }
};
