/**
 * Safely extracts required environment variables with type safety
 *
 * Validates that all specified environment variables are present and non-empty,
 * throwing an error if any are missing. Returns both an object and array
 * representation of the values for different use cases.
 *
 * @param keys - The environment variable names to extract (at least one required)
 * @returns Object containing both object and array representations of the values
 * @throws Error if any environment variables are missing or empty
 *
 * @example
 * ```typescript
 * // Extract required environment variables
 * const { object, values } = pickFromProcessEnv('API_URL', 'SECRET_KEY', 'DB_HOST');
 *
 * // Use as object (type-safe keys)
 * console.log(object.API_URL);  // string
 * console.log(object.SECRET_KEY);  // string
 *
 * // Use as array (maintains order)
 * const [apiUrl, secretKey, dbHost] = values;
 * ```
 */
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
        /** Type-safe object with environment variable names as keys */
        object: Object.freeze(parameters),
        /** Array of values in the same order as the input keys */
        values: Object.freeze(orderedArray),
    };
}
