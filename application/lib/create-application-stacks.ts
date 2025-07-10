import type { StageProps } from 'aws-cdk-lib';
import type { Construct } from 'constructs';

/**
 * Shared utility function to create all application stacks
 *
 * This is the primary mechanism for composing services and other stacks to create the application.
 */
export function createApplicationStacks(_scope: Construct, _stage: string, _props?: StageProps) {}
