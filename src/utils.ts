/**
 * @fileoverview Utility functions for the logger module.
 * Provides helper functions for common operations like copying maps.
 */

/**
 * Creates a shallow copy of a Map.
 *
 * Iterates through all key-value pairs in the source map and copies them to a new map instance.
 * This creates a new Map with the same entries but independent from the original, preventing
 * unintended mutations from affecting both maps.
 *
 * Used internally by the Logger class to ensure property isolation between parent and child loggers.
 *
 * @template K - The type of keys in the map
 * @template V - The type of values in the map
 * @param {Map<K, V>} source - The source map to copy
 * @returns {Map<K, V>} A new map containing all key-value pairs from the source map
 *
 * @example
 * const original = new Map([["userId", 123], ["sessionId", "abc"]]);
 * const copy = copyMap(original);
 * copy.set("userId", 456);
 * console.log(original.get("userId")); // Still 123
 * console.log(copy.get("userId")); // 456
 *
 * @example
 * // Used internally by Logger to ensure property isolation
 * const logger1 = Logger.Root().WithProperty("userId", 1);
 * const logger2 = logger1.WithProperty("action", "login");
 * // logger1 still only has userId, logger2 has both userId and action
 * // Changes to logger2's properties don't affect logger1
 */
export function copyMap<K, V>(source: Map<K, V>): Map<K, V> {
	const result = new Map<K, V>();
	source.forEach((value, key) => {
		result.set(key, value);
	});
	return result;
}
