import type { SsmParameterGroup } from '../constructs/ssm-parameter-group';

export function pickFromProcessEnv<T extends string>(...keys: [T, ...T[]]) {
    const errors = [];
    const entries = [];

    for (const key of keys) {
        const value = process.env[key as keyof typeof process.env];

        if (!value) {
            errors.push(`Environment variable ${String(key)} is not set`);
        } else {
            entries.push([key, value] as const);
        }
    }

    if (errors.length > 0) {
        throw new Error(errors.join('\n'));
    }

    const parameters = Object.fromEntries(entries) as Record<T, string>;
    const orderedArray = entries.map(entry => entry[1]);

    return {
        object: Object.freeze(parameters),
        values: Object.freeze(orderedArray),
    };
}

/**
 * Utility type to infer the keys of an SsmParameterGroup
 *
 * @example
 * ```ts
 * type MyKeys = Keys<MyParameters>;
 * ```
 */
export type Keys<T extends SsmParameterGroup> = keyof T['parameters'];
