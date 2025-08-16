import type { Function } from 'aws-cdk-lib/aws-lambda';
import {
    DefinitionBody,
    StateMachine,
    type StateMachineProps,
} from 'aws-cdk-lib/aws-stepfunctions';
import { propertyInjectable } from 'aws-cdk-lib/core/lib/prop-injectable';
import { Construct } from 'constructs';

export interface StepFunctionFromFileProps extends StateMachineProps {
    readonly filepath: string;
    readonly lambdaFunctions?: Function[];
}

/**
 * Merges Lambda function ARNs into definition substitutions
 *
 * Creates definition substitutions that map Lambda function IDs to their ARNs,
 * enabling the use of `${functionId}` placeholders in Step Function definitions.
 *
 * @param props - The Step Function properties containing lambda functions and substitutions
 * @returns Object with merged definition substitutions, or empty object if no lambda functions
 */
function prepareDefinitionSubstitutionsObject(props: StepFunctionFromFileProps) {
    const { definitionSubstitutions, lambdaFunctions } = props;

    if (!lambdaFunctions?.length) {
        return {};
    }

    const lambdaDefinitions = Object.fromEntries(
        lambdaFunctions.map(fn => [fn.node.id, fn.functionArn])
    );

    return { definitionSubstitutions: { ...definitionSubstitutions, ...lambdaDefinitions } };
}

/**
 * Step Function construct that loads its definition from a file
 *
 * Extends the standard StateMachine construct to load the state machine definition
 * from an external YAML or JSON file. Supports automatic Lambda function integration
 * through definition substitutions and IAM permission grants.
 *
 * Features:
 * - Loads definition from external files (YAML or JSON)
 * - Automatic Lambda function ARN substitution using `${functionId}` placeholders
 * - Automatic IAM permission grants for Lambda function invocation
 * - Property injectable for configuration via CDK property injectors
 *
 * @example
 * ```typescript
 * // Basic usage
 * new StepFunctionFromFile(this, 'MyWorkflow', {
 *   filepath: 'src/step-functions/workflow.asl.yaml',
 * });
 *
 * // With Lambda function integration
 * new StepFunctionFromFile(this, 'WorkflowWithLambdas', {
 *   filepath: 'src/step-functions/workflow.asl.yaml',
 *   lambdaFunctions: [processFunction, validateFunction],
 *   definitionSubstitutions: {
 *     BucketName: myBucket.bucketName,
 *   },
 * });
 * ```
 *
 * @see https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_stepfunctions.StateMachine.html
 */
@propertyInjectable
export class StepFunctionFromFile extends StateMachine {
    /**
     * Creates a new StepFunctionFromFile construct
     *
     * @param scope - The parent construct
     * @param id - The construct ID
     * @param props - Properties including file path and optional Lambda functions
     */
    constructor(scope: Construct, id: string, props: StepFunctionFromFileProps) {
        // Add lambda functions to definition substitutions if they have been provided
        const definitionSubstitutionsObject = prepareDefinitionSubstitutionsObject(props);

        const { filepath, ...newProps } = {
            ...props,
            ...definitionSubstitutionsObject,
        };

        super(scope, id, {
            definitionBody: DefinitionBody.fromFile(props.filepath),
            ...newProps,
        });

        // If lambda functions are provided, give the state machine
        // permission to invoke them
        // TODO Is there a more efficient way to do this?
        if (props.lambdaFunctions) {
            props.lambdaFunctions.forEach(fn => {
                fn.grantInvoke(this);
            });
        }
    }
}
