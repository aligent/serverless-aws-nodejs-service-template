/* v8 ignore start - not sure how to test this one or if it's really worth doing so */

// Adapted from https://github.com/adriencaccia/cdk-bundle-analyzer/ - it wasn't maintained
// and didn't find our cdk.out directory correctly

import { Annotations, IAspect, Stack, Stage } from 'aws-cdk-lib';
import { CfnFunction } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { IConstruct } from 'constructs';
import { Metadata, TemplateType, visualizer } from 'esbuild-visualizer';
import { existsSync, promises as fs } from 'fs';
import open from 'open';
import { tmpdir } from 'os';
import { dirname, join, resolve } from 'path';

/**
 * Return `true` if `node` is a `NodejsFunction` instance or a custom function construct instance.
 *
 * We cannot use `instanceof` because the `NodejsFunction` class will be copied in the imported code.
 *
 * See https://stackoverflow.com/a/63937850
 */
function isNodejsFunction(
    node: IConstruct,
    customFunctionConstructName?: string
): node is NodejsFunction {
    return (
        node.constructor.name === NodejsFunction.name ||
        node.constructor.name === customFunctionConstructName
    );
}

interface FunctionBundleAnalyzerAspectProps {
    customFunctionConstruct?: typeof NodejsFunction;
}

export class FunctionBundleAnalyzerAspect implements IAspect {
    private customFunctionConstructName: string | undefined;

    constructor(props?: FunctionBundleAnalyzerAspectProps) {
        this.customFunctionConstructName =
            props?.customFunctionConstruct?.prototype.constructor.name;
    }

    async visit(node: IConstruct): Promise<void> {
        const functionToAnalyze = node.node.tryGetContext('analyze') as string | undefined;
        if (functionToAnalyze === undefined) {
            return;
        }
        const template = node.node.tryGetContext('template') as TemplateType | undefined;

        if (isNodejsFunction(node, this.customFunctionConstructName)) {
            if (!node.toString().includes(functionToAnalyze)) {
                return;
            }

            if (template !== undefined && !['sunburst', 'treemap', 'network'].includes(template)) {
                Annotations.of(node).addError(
                    `🤯 Analyze failed: template ${template} is not supported. Should be one of 'sunburst', 'treemap', 'network'`
                );

                return;
            }

            Annotations.of(node).addInfo('⏳ Analyzing function');

            const assetPath = (node.node.defaultChild as CfnFunction).cfnOptions.metadata?.[
                'aws:asset:path'
            ] as string;

            const stack = Stack.of(node);
            const stage = Stage.of(stack);
            if (!stage) {
                Annotations.of(node).addError('🤯 Could not determine stage for stack');
                return;
            }
            // The asset path is relative to the stack template file, so we need to resolve it from there
            const templateDir = dirname(join(stage.outdir, stack.templateFile));
            const metafilePath = resolve(templateDir, assetPath, 'index.meta.json');

            const metafileExists = existsSync(metafilePath);
            if (!metafileExists) {
                Annotations.of(node).addError(
                    `🤯 Analyze failed: metafile ${metafilePath} not found. Make sure metafile: true is specified in the bundling options?`
                );

                return;
            }
            const textContent = await fs.readFile(metafilePath, { encoding: 'utf-8' });

            const jsonContent = JSON.parse(textContent) as Metadata;

            const fileContent = await visualizer(jsonContent, {
                title: `${functionToAnalyze} function bundle visualizer `,
                template: template ?? 'treemap',
            });

            const TMP_FOLDER = join(tmpdir(), 'cdk-bundle-analyzer');
            const TEMP_DIR_LOCATION = join(TMP_FOLDER, new Date().getTime().toString());

            const filename = `${TEMP_DIR_LOCATION}/${functionToAnalyze}.html`;

            await fs.mkdir(dirname(filename), { recursive: true });
            await fs.writeFile(filename, fileContent);

            await open(filename);
        }
    }
}
