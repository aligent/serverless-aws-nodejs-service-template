import { Function } from 'aws-cdk-lib/aws-lambda';
import { type IStringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

/**
 * Abstract class to group SSM parameters together.
 *
 * This class is used to group SSM parameters together and grant permissions to functions.
 *
 * @example
 * ```ts
 * class ClientParameters extends SsmParameterGroup {
 *     public readonly parameters;
 *
 *     constructor(scope: Construct, id = 'ClientParameters') {
 *         super(scope, id);
 *
 *         const CLIENT_USERNAME = StringParameter.fromStringParameterName(
 *             this,
 *             'clientUsername',
 *             `/path/to/username`
 *         );
 *
 *         this.parameters = {
 *             CLIENT_USERNAME,
 *         } as const;
 *     }
 * }
 *
 * const clientParameters = new ClientParameters(this);
 *
 * clientParameters.grantToFunction(someLambdaFunction, 'read');
 */
export abstract class SsmParameterGroup<
    T extends Record<string, IStringParameter> = Record<string, IStringParameter>,
> extends Construct {
    public abstract readonly parameters: T;

    // TODO: Investigate using the parameters/secrets extension for fetching SSM parameters from Lambda
    // https://docs.aws.amazon.com/systems-manager/latest/userguide/ps-integration-lambda-extensions.html

    // TODO: Should this generate a shared role instead?
    // Concerned this might generate more cloudformation than it needs to
    grantToFunction(grantee: Function, permission: 'read' | 'write' | 'readwrite') {
        Object.entries(this.parameters).forEach(([key, param]) => {
            grantee.addEnvironment(key, param.parameterName);
            if (permission === 'write' || permission === 'readwrite') {
                param.grantWrite(grantee);
            }

            if (permission === 'read' || permission === 'readwrite') {
                param.grantRead(grantee);
            }
        });
    }

    grantToFunctions(grantees: Function[], permission: 'read' | 'write' | 'readwrite') {
        grantees.forEach(grantee => {
            this.grantToFunction(grantee, permission);
        });
    }
}
