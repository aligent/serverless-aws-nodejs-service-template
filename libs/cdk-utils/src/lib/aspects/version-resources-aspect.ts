import type { IAspect } from 'aws-cdk-lib';
import { Function } from 'aws-cdk-lib/aws-lambda';
import {
    CfnStateMachineAlias,
    CfnStateMachineVersion,
    StateMachine,
} from 'aws-cdk-lib/aws-stepfunctions';
import { IConstruct } from 'constructs';

/**
 * Aspect to add versioning and aliases to resources
 *
 * Currently supports:
 * - Step Functions
 * - Lambda Functions
 */
export class VersionResourcesAspect implements IAspect {
    constructor(
        private readonly props: {
            alias: string;
        } = {
            alias: 'LATEST',
        }
    ) {}

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
