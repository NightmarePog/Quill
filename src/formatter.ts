/**
 * @fileoverview Message formatting utilities for the logger.
 * Provides functions to format log messages with placeholder substitution,
 * value formatting, and JSON serialization capabilities.
 */

/**
 * Type for values that can be formatted in log message templates.
 * Restricted to primitive types with straightforward string representations.
 *
 * @typedef {(string | number | boolean | undefined)} FormatValue
 */
type FormatValue = string | number | boolean | undefined;

/**
 * Configuration options for customizing how values are formatted in log messages.
 * Allows control over number precision, string width, padding, and text alignment.
 *
 * @interface FormatOptions
 * @property {number} [decimals] - Number of decimal places for floating-point numbers.
 *           Example: `{ decimals: 2 }` converts 3.14159 to "3.14"
 * @property {number} [width] - Minimum width in characters for the formatted value.
 *           If the value is shorter, it will be padded using `padChar`.
 *           Example: `{ width: 10 }` pads "hello" to 10 characters
 * @property {string} [padChar=" "] - Character used for padding when width is specified.
 *           Defaults to space character. Example: `{ width: 5, padChar: "0" }` pads "42" to "00042"
 * @property {"left"|"right"} [align="right"] - Alignment for padded values.
 *           "right" pads on the left, "left" pads on the right.
 *           Example: `{ width: 10, align: "left" }` pads "hello" to "hello     "
 *
 * @example
 * // Format a number to 2 decimal places
 * const opts1: FormatOptions = { decimals: 2 };
 *
 * // Pad a string to 10 characters with zeros, right-aligned
 * const opts2: FormatOptions = { width: 10, padChar: "0", align: "right" };
 *
 * // Pad a string to 8 characters with spaces, left-aligned
 * const opts3: FormatOptions = { width: 8, align: "left" };
 */
export interface FormatOptions {
	decimals?: number;
	width?: number;
	padChar?: string;
	align?: "left" | "right";
}

/**
 * Converts a value to a formatted string representation with optional formatting options.
 *
 * Handles special Roblox types like Vector3 and tables (JSON serialization).
 * Numbers can be formatted with a specific number of decimal places.
 * All values can be padded to a minimum width with a custom padding character.
 *
 * @private
 * @param {unknown} val - The value to format. Can be any type.
 * @param {FormatOptions} [opts={}] - Formatting options to apply
 * @returns {string} The formatted string representation of the value
 *
 * @example
 * // Format a number with decimal places
 * formatValue(3.14159, { decimals: 2 }); // Returns "3.14"
 *
 * @example
 * // Pad a string to the right
 * formatValue("hi", { width: 5, padChar: "0", align: "left" }); // Returns "hi000"
 *
 * @example
 * // Pad a number to the left with zeros
 * formatValue(42, { width: 4, padChar: "0", align: "right" }); // Returns "0042"
 *
 * @example
 * // Format a Vector3 (Roblox type)
 * formatValue(new Vector3(1, 2, 3), {}); // Returns "(1, 2, 3)"
 *
 * @example
 * // Format a table as JSON
 * formatValue({ name: "Alice", age: 30 }, {}); // Returns '{"name":"Alice","age":30}'
 */
function formatValue(val: unknown, opts: FormatOptions = {}): string {
	const { decimals, width, padChar = " ", align = "right" } = opts;

	let result: string;

	if (typeOf(val) === "number") {
		result = decimals !== undefined ? string.format(`%.${decimals}f`, val as number) : tostring(val);
	} else if (typeOf(val) === "Vector3") {
		const v = val as Vector3;
		result = `(${math.round(v.X)}, ${math.round(v.Y)}, ${math.round(v.Z)})`;
	} else if (typeOf(val) === "table") {
		const [ok, json] = pcall(() => game.GetService("HttpService").JSONEncode(val));
		result = ok ? json : tostring(val);
	} else {
		result = tostring(val ?? "nil");
	}

	if (width !== undefined && result.size() < width) {
		const padding = string.rep(padChar, width - result.size());
		result = align === "left" ? result + padding : padding + result;
	}

	return result;
}

/**
 * Serializes a value to its complete JSON representation.
 *
 * Used internally for the "@" serialization modifier in format strings.
 * Attempts to use Roblox's HttpService:JSONEncode for proper serialization.
 * Falls back to tostring() if JSON encoding fails.
 *
 * @private
 * @param {unknown} val - The value to serialize to JSON
 * @returns {string} The JSON string representation, or the string representation if JSON encoding fails
 *
 * @example
 * // Serialize a table to JSON
 * serializeDeep({ name: "Alice", age: 30 }); // Returns '{"name":"Alice","age":30}'
 *
 * @example
 * // Fallback for non-serializable values
 * serializeDeep(function() {}); // Returns string representation
 */
function serializeDeep(val: unknown): string {
	const [ok, result] = pcall(() => game.GetService("HttpService").JSONEncode(val));
	return ok ? result : tostring(val);
}

/**
 * Formats a message template by replacing placeholders with formatted argument values.
 *
 * This is the core formatting function used by the logger. It supports two styles of placeholders:
 * - `{Name}` - Replaces with the argument formatted using `formatValue()`
 * - `{@Name}` - Replaces with the argument serialized using `serializeDeep()` for deep inspection
 *
 * Arguments are matched to placeholders in order of appearance in the template.
 * Values can be wrapped with `fmt()` to apply custom formatting options.
 *
 * @param {string} template - The message template string containing placeholders in `{Name}` or `{@Name}` format
 * @param {unknown[]} args - Array of values to substitute into placeholders, in order
 * @returns {string} The formatted message with all placeholders replaced with their values
 *
 * @example
 * // Basic placeholder substitution
 * formatMessage("User {Name} is {Age} years old", ["Alice", 30]);
 * // Returns: "User Alice is 30 years old"
 *
 * @example
 * // Deep serialization with @ modifier
 * formatMessage("Data: {@Data}", [{ x: 1, y: 2 }]);
 * // Returns: 'Data: {"x":1,"y":2}'
 *
 * @example
 * // Custom formatting with fmt() wrapper
 * formatMessage("ID: {ID}", [fmt(42, { width: 5, padChar: "0" })]);
 * // Returns: "ID: 00042"
 *
 * @example
 * // Multiple placeholders and custom formatting
 * formatMessage("User {UserId}: {Count} actions at {Time}", [
 *   fmt(123, { width: 8, padChar: "0" }),
 *   fmt(42, { width: 3, padChar: "0" }),
 *   fmt(3.14159, { decimals: 2 })
 * ]);
 * // Returns: "User 00000123: 042 actions at 3.14"
 */
export function formatMessage(template: string, args: unknown[]): string {
	let index = 0;
	return template.gsub("{(@?)([%w_]+)}", (serialize: string, _key: string) => {
		const val = args[index++];

		if (typeIs(val, "table") && (val as Record<string, unknown>)["__fmt"] !== undefined) {
			const entry = val as { value: FormatValue; opts: FormatOptions };
			return formatValue(entry.value, entry.opts);
		}

		return serialize === "@" ? serializeDeep(val) : formatValue(val);
	})[0];
}

/**
 * Wraps a value with custom formatting options for use in log message templates.
 *
 * This function creates a special wrapper object that `formatMessage()` recognizes
 * and applies the provided formatting options to when substituting the value.
 * This allows you to specify how a particular value should be formatted in a message
 * without affecting how it's normally formatted elsewhere.
 *
 * @param {FormatValue} value - The value to format (must be string, number, boolean, or undefined)
 * @param {FormatOptions} opts - Formatting options to apply to this value
 * @returns {{ value: FormatValue; opts: FormatOptions; __fmt: true }}
 *          A special wrapper object recognized by formatMessage()
 *
 * @example
 * // Format a status string with left alignment
 * logger.info(
 *   "Status: {Status}",
 *   fmt("ACTIVE", { width: 10, align: "left" })
 * );
 * // Logs: "Status: ACTIVE     " (left-aligned in 10-character field)
 *
 * @example
 * // Format a temperature with specific decimal places
 * logger.info(
 *   "Temperature: {Temp} degrees",
 *   fmt(98.6, { decimals: 1 })
 * );
 * // Logs: "Temperature: 98.6 degrees"
 *
 * @example
 * // Format an ID with zero-padding
 * logger.info(
 *   "User ID: {ID}",
 *   fmt(12345, { width: 8, padChar: "0" })
 * );
 * // Logs: "User ID: 00012345"
 *
 * @example
 * // Combine multiple formatted values
 * logger.info(
 *   "Progress: {Current}/{Total} ({Percent}%)",
 *   fmt(25, { width: 3, padChar: "0" }),
 *   fmt(100, { width: 3, padChar: "0" }),
 *   fmt(25, { decimals: 1 })
 * );
 * // Logs: "Progress: 025/100 (25.0%)"
 */
export function fmt(value: FormatValue, opts: FormatOptions): { value: FormatValue; opts: FormatOptions; __fmt: true } {
	return { value, opts, __fmt: true };
}
