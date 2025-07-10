import { Stack, type StackProps } from 'aws-cdk-lib';
import { ParameterTier, StringParameter } from 'aws-cdk-lib/aws-ssm';
import type { Construct } from 'constructs';

/**
 * Bootstrap stack for development environment
 * Creates SSM parameters with default values if they don't already exist
 */
export class BootstrapStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        // Magento Parameters
        this.createParameter('/example/path', 'example-value', 'Example description');
    }

    /**
     * Creates a standard SSM string parameter
     */
    private createParameter(name: string, defaultValue: string, description: string): void {
        new StringParameter(this, this.sanitizeId(name), {
            parameterName: name,
            stringValue: defaultValue,
            description: description,
            tier: ParameterTier.STANDARD,
        });
    }

    /**
     * Sanitizes parameter name to create a valid CDK construct ID
     */
    private sanitizeId(parameterName: string): string {
        return parameterName.replace(/\//g, '-').replace(/^-/, '').replace(/-+/g, '-');
    }
}
