import { Parameter } from '@aws-sdk/client-ssm';
import path from 'path';
import { getParametersByPath } from './aws/ssm';

export const SSM_ROOT = process.env.SSM_ROOT;

const ssmParams = await getParametersByPath(SSM_ROOT);

export function extractParameterValueFromName(
    ssmPathName: string,
    params: Parameter[]
) {
    console.log('extracting', ssmPathName);
    return params?.filter((param) => {
        return param.Name === `${ssmPathName}`;
    })[0]?.Value;
}

export async function getConfigurations<T extends string>(
    ssmPath: string,
    params: readonly string[]
) {
    const parameters = Object.fromEntries(params.map((name) => [name, null]));

    const fullPath = path.join(SSM_ROOT, ssmPath, '/');
    console.log('FULL SSM:', ssmParams);

    for (const name of params) {
        const value = extractParameterValueFromName(
            `${fullPath}${name}`,
            ssmParams
        );

        if (!value) {
            const error = new Error(
                `SSM parameter named ${fullPath}${name} does not exist`
            );
            console.error(error.toString());
            throw error;
        }

        parameters[name] = value;
    }

    return parameters as Record<T, string>;
}
