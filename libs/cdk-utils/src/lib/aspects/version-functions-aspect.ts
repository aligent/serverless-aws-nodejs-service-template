import type { IAspect } from 'aws-cdk-lib';
import { Function } from 'aws-cdk-lib/aws-lambda';
import {
    CfnStateMachineAlias,
    CfnStateMachineVersion,
    StateMachine,
} from 'aws-cdk-lib/aws-stepfunctions';
import { IConstruct } from 'constructs';

/**
 * Aspect that automatically adds versioning and aliases to Lambda and Step Functions
 *
 * Visits all constructs in the scope and automatically creates versions and aliases
 * for supported resource types. This enables blue-green deployments, traffic shifting,
 * and provides stable ARNs for external integrations.
 *
 * Currently supports:
 * - Lambda Functions: Creates function aliases
 * - Step Functions: Creates versions and aliases with 100% traffic routing
 *
 * @example
 * ```typescript
 * // Apply to entire app for automatic versioning
 * Aspects.of(app).add(new VersionFunctionsAspect());
 *
 * // Or with custom alias name
 * Aspects.of(app).add(new VersionFunctionsAspect({ alias: 'PROD' }));
 * ```
 */
export class VersionFunctionsAspect implements IAspect {
    /**
     * Creates a new VersionFunctionsAspect
     *
     * @param props - Configuration for the aspect
     * @param props.alias - Name for the alias to create. Defaults to 'LATEST'
     */
    constructor(
        private readonly props: {
            alias: string;
        } = {
            alias: 'LATEST',
        }
    ) {}

    /**
     * Visits a construct and applies versioning if it's a supported resource type
     *
     * For Lambda Functions: Adds a function alias pointing to $LATEST
     * For Step Functions: Creates a version and alias with 100% traffic routing
     *
     * @param node - The construct to potentially add versioning to
     */
    visit(node: IConstruct): void {
        if (node instanceof StateMachine) {
            const version = new CfnStateMachineVersion(node, `Version`, {
                stateMachineArn: node.stateMachineArn,
            });

            new CfnStateMachineAlias(node, `Alias`, {
                name: this.props.alias,
                routingConfiguration: [
                    {
                        stateMachineVersionArn: version.attrArn,
                        weight: 100,
                    },
                ],
            });
        }

        if (node instanceof Function) {
            node.addAlias(this.props.alias);
        }
    }
}
