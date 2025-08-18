import { beforeAll } from 'vitest'

beforeAll(() => {
    expect.addSnapshotSerializer(
        replaceProperties({ property: [
            // Replace asset storage locations in Lambda function snapshots
            'Code.S3Bucket',
            'Code.S3Key',
            // Replace asset storage locations in Step Function snapshots
            'DefinitionS3Location.Bucket',
            'DefinitionS3Location.Key'
        ] })
    );
})

const PLACEHOLDER = '[SNAPSHOT_PLACEHOLDER]';
const isObject = (val) => !!val && typeof val === 'object';

// Helper function to traverse object and find properties to replace
const findPropertiesToReplace = (
    obj,
    property,
    path = []
) => {
    const results = [];

    for (const [key, value] of Object.entries(obj)) {
        const currentPath = [...path, key];
        const fullPath = currentPath.join('.');

        let shouldReplace = false;

        if (property instanceof RegExp) {
            shouldReplace = property.test(fullPath);
        } else if (Array.isArray(property)) {
            shouldReplace = property.includes(fullPath);
        } else {
            shouldReplace = fullPath === property;
        }

        if (shouldReplace && value !== PLACEHOLDER) {
            results.push({ path: currentPath, value });
        }

        if (isObject(value)) {
            results.push(...findPropertiesToReplace(value, property, currentPath));
        }
    }

    return results;
};

// Helper function to set value at nested path
const setValueAtPath = (obj, path, value) => {
    let current = obj;

    for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        if (!isObject(current[key])) {
            current[key] = {};
        }
        current = current[key];
    }

    current[path[path.length - 1]] = value;
};

/**
 * Custom serializer for vitest snapshot tests
 * Allows replacing properties in a snapshot with placeholder values.
 *
 * Properties to replace can be specified as a string, array of strings, or a single regular expression
 * Nested properties can be specified using dot notation.
 *
 * @example
 * ```
 * beforeAll(() => {
 *     expect.addSnapshotSerializer(
 *         // Will replace the value of Code: { S3Bucket: '...', S3Key: '...' } anywhere in the object structure
 *         replaceProperties({ property: ['Code.S3Bucket', 'Code.S3Key'] })
 *     );
 * })
 * ```
 *
 * @param {{ property: string | string[] | RegExp, placeholder?: string }} input
 * @returns
 */
export const replaceProperties = ({
    property,
    placeholder = PLACEHOLDER,
}) => {
    return {
        test(val) {
            if (!isObject(val)) return false;
            const propertiesToReplace = findPropertiesToReplace(val, property);
            return propertiesToReplace.length > 0;
        },
        serialize(val, config, indentation, depth, refs, printer) {
            const clone = { ...val };
            const propertiesToReplace = findPropertiesToReplace(clone, property);

            for (const { path } of propertiesToReplace) {
                setValueAtPath(clone, path, placeholder);
            }

            return printer(clone, config, indentation, depth, refs);
        },
    }
};
