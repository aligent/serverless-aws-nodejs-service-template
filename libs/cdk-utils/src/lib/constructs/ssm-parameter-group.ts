import { Stage } from 'aws-cdk-lib';
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
 * class ClientParameters extends SsmParameterGroup<'CLIENT_USERNAME' | 'CLIENT_PASSWORD'> {
 *     public readonly parameters;
 *
 *     constructor(scope: Construct, id = 'ClientParameters') {
 *         super(scope, id);
 *
 *         const CLIENT_USERNAME = StringParameter.fromStringParameterName(
 *             this,
 *             'clientUsername',
 *             `prefix/${this.stageName}/path/to/username`
 *         );
 *
 *         const CLIENT_PASSWORD = StringParameter.fromStringParameterName(
 *             this,
 *             'clientPassword',
 *             `prefix/${this.stageName}/path/to/password`
 *         );
 *
 *         this.parameters = {
 *             CLIENT_USERNAME,
 *             CLIENT_PASSWORD,
 *         } as const;
 *     }
 * }
 *
 * const clientParameters = new ClientParameters(this);
 *
 * clientParameters.grantToFunction(someLambdaFunction, 'read');
 */
export abstract class SsmParameterGroup<
    K extends string,
    T extends Record<string, IStringParameter> = Record<K, IStringParameter>,
> extends Construct {
    /**
     * The parameters in this group
     */
    public abstract readonly parameters: T;

    /**
     * The name of the containing stage, or 'app' if no stage is found.
     */
    protected readonly stageName: string;

    constructor(scope: Construct, id: string) {
        super(scope, id);

        const STAGE_NAME = Stage.of(this)?.stageName;

        if (!STAGE_NAME) {
            throw new Error('This construct must be used within a named CDK Stage');
        }

        this.stageName = STAGE_NAME;
    }

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
