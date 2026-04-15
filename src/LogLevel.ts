/**
 * @fileoverview Log level enumeration and utility functions for the logger.
 * Provides definitions for log severity levels and conversion utilities.
 */

/**
 * Enumeration of log severity levels.
 * Levels are ordered from least to most severe.
 *
 * @enum {number}
 * @readonly
 */
export enum LogLevel {
	/** Trace level - most verbose, used for detailed diagnostic information */
	Trace = 0,
	/** Debug level - detailed information for debugging purposes */
	Debug = 1,
	/** Info level - general informational messages */
	Info = 2,
	/** Warn level - warning messages for potentially problematic situations */
	Warn = 3,
	/** Error level - error messages for error conditions */
	Error = 4,
	/** Fatal level - fatal error messages for critical failures */
	Fatal = 5,
	/** Off level - disables all logging */
	Off = 6,
}

/**
 * Converts a log level to its string representation.
 *
 * @param {LogLevel} level - The log level to convert
 * @returns {string} The uppercase string representation of the log level
 *
 * @example
 * levelToString(LogLevel.Debug); // Returns "DEBUG"
 * levelToString(LogLevel.Error); // Returns "ERROR"
 */
export function levelToString(level: LogLevel): string {
	switch (level) {
		case LogLevel.Trace:
			return "TRACE";
		case LogLevel.Debug:
			return "DEBUG";
		case LogLevel.Info:
			return "INFO";
		case LogLevel.Warn:
			return "WARN";
		case LogLevel.Error:
			return "ERROR";
		case LogLevel.Fatal:
			return "FATAL";
		case LogLevel.Off:
			return "OFF";
	}
}

/**
 * Converts a string representation to a log level.
 * String matching is case-insensitive.
 *
 * @param {string} str - The string representation of the log level
 * @returns {LogLevel} The corresponding log level, or LogLevel.Info if not recognized
 *
 * @example
 * levelFromString("debug"); // Returns LogLevel.Debug
 * levelFromString("ERROR"); // Returns LogLevel.Error
 * levelFromString("unknown"); // Returns LogLevel.Info (default)
 */
export function levelFromString(str: string): LogLevel {
	switch (str.upper()) {
		case "TRACE":
			return LogLevel.Trace;
		case "DEBUG":
			return LogLevel.Debug;
		case "INFO":
			return LogLevel.Info;
		case "WARN":
			return LogLevel.Warn;
		case "ERROR":
			return LogLevel.Error;
		case "FATAL":
			return LogLevel.Fatal;
		case "OFF":
			return LogLevel.Off;
		default:
			return LogLevel.Info;
	}
}

/**
 * Determines if a log level should be enabled based on minimum threshold.
 * A level is enabled if it's at or above the minimum level and not Off.
 *
 * @param {LogLevel} current - The current log level to check
 * @param {LogLevel} min - The minimum log level threshold
 * @returns {boolean} True if the current level is enabled, false otherwise
 *
 * @example
 * isEnabled(LogLevel.Error, LogLevel.Warn); // Returns true (Error >= Warn)
 * isEnabled(LogLevel.Debug, LogLevel.Warn); // Returns false (Debug < Warn)
 * isEnabled(LogLevel.Off, LogLevel.Info); // Returns false (Off disables all)
 */
export function isEnabled(current: LogLevel, min: LogLevel): boolean {
	return current !== LogLevel.Off && current >= min;
}

/**
 * Gets the hex color code for a log level.
 * Colors are used for visual formatting of log output.
 *
 * @param {LogLevel} level - The log level to get the color for
 * @returns {string} Hex color code (e.g., "#FF1744")
 *
 * @example
 * levelToColor(LogLevel.Error); // Returns "#E57373"
 * levelToColor(LogLevel.Fatal); // Returns "#FF1744"
 * levelToColor(LogLevel.Debug); // Returns "#64B5F6"
 */
export function levelToColor(level: LogLevel): string {
	switch (level) {
		case LogLevel.Trace:
			return "#9E9E9E";
		case LogLevel.Debug:
			return "#64B5F6";
		case LogLevel.Info:
			return "#81C784";
		case LogLevel.Warn:
			return "#FFB74D";
		case LogLevel.Error:
			return "#E57373";
		case LogLevel.Fatal:
			return "#FF1744";
		default:
			return "#FFFFFF";
	}
}

/**
 * Generates an HTML-formatted prefix for a log level with color.
 * Intended for use in formatted log output.
 *
 * @param {LogLevel} level - The log level to generate a prefix for
 * @returns {string} HTML-formatted prefix string (e.g., "<font color="#E57373">[ERROR]</font>")
 *
 * @example
 * levelToPrefix(LogLevel.Error); // Returns '<font color="#E57373">[ERROR]</font>'
 * levelToPrefix(LogLevel.Info); // Returns '<font color="#81C784">[INFO]</font>'
 */
export function levelToPrefix(level: LogLevel): string {
	const color = levelToColor(level);
	const name = levelToString(level);
	return `<font color="${color}">[${name}]</font>`;
}
