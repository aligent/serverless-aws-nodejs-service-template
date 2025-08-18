import type { InjectionContext } from 'aws-cdk-lib';
import { Stage } from 'aws-cdk-lib';
import { inspect } from 'util';

/* v8 ignore start */
// TODO: Replace this with a decorator when we move away from ESBuild bundling
export function logInjector(
    constructorName: string,
    configuration: unknown,
    context: InjectionContext
) {
    if (process.env.DEBUG === 'true') {
        // ANSI color codes for terminal output
        const cyan = '\x1b[36m';
        const yellow = '\x1b[33m';
        const green = '\x1b[32m';
        const reset = '\x1b[0m';
        const dim = '\x1b[2m';

        const stageName = Stage.of(context.scope)?.stageName || 'unknown';

        console.log(
            `${cyan}► ${constructorName}${reset}: Injecting defaults for ${yellow}${context.id}${reset} in stage ${green}${stageName}${reset}`
        );

        // Pretty-print the configuration with colors and indentation
        const formattedConfig = inspect(configuration, {
            colors: true,
            depth: 4,
            compact: false,
            sorted: true,
        });

        console.log(`${dim}  Configuration:${reset}`);
        // Indent each line of the configuration for better readability
        formattedConfig.split('\n').forEach(line => {
            console.log(`    ${line}`);
        });
    }
}
