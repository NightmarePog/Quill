import { LogLevel } from "./LogLevel";

/**
 * Represents a structured log event with all contextual information.
 *
 * Log events are the core data structure passed through the logging pipeline.
 * They contain the log level, message, context, timestamp, and custom properties.
 *
 * @interface LogEvent
 */
export interface LogEvent {
	/** The severity level of this log event */
	level: LogLevel;

	/** Human-readable name of the log level (e.g., "INFO", "ERROR") */
	levelName: string;

	/** The fully formatted message with all placeholders replaced */
	message: string;

	/** The original message template with placeholders intact (e.g., "User {UserId} logged in") */
	messageTemplate: string;

	/** Optional context string identifying the source of the log (e.g., "UserService.Login") */
	context: string | undefined;

	/** Unix timestamp when the event was created */
	timestamp: number;

	/** Key-value map of custom properties attached to this event */
	properties: Map<string, unknown>;
}

/**
 * Interface for log event sinks.
 *
 * Sinks are responsible for receiving and processing log events. Implementations
 * might write to files, send to remote services, display in UI, etc.
 *
 * @interface ILogEventSink
 */
export interface ILogEventSink {
	/**
	 * Emits a log event to this sink.
	 *
	 * @param {LogEvent} event - The log event to emit
	 */
	Emit(event: LogEvent): void;

	/**
	 * Optional method to flush any buffered events.
	 * Called by the logger when flushing is requested.
	 */
	flush?(): void;
}

/**
 * Interface for log event enrichers.
 *
 * Enrichers modify log events before they are sent to sinks. They can add properties,
 * modify messages, or perform other transformations.
 *
 * @interface ILogEnricher
 */
export interface ILogEnricher {
	/**
	 * Enriches a log event by modifying it in place.
	 *
	 * @param {LogEvent} event - The log event to enrich
	 */
	Enrich(event: LogEvent): void;
}

/**
 * Main logger interface.
 *
 * Provides a structured logging API with methods for different log levels,
 * context/property management, and utilities like timers and assertions.
 *
 * @interface ILogger
 */
export interface ILogger {
	/**
	 * Logs a trace-level message.
	 * Trace is the lowest level and is typically used for very detailed diagnostic info.
	 *
	 * @param {string} msg - Message template with optional placeholders
	 * @param {...unknown[]} args - Values to replace placeholders
	 */
	trace(msg: string, ...args: unknown[]): void;

	/**
	 * Logs a debug-level message.
	 * Debug is used for diagnostic information helpful during development.
	 *
	 * @param {string} msg - Message template with optional placeholders
	 * @param {...unknown[]} args - Values to replace placeholders
	 */
	debug(msg: string, ...args: unknown[]): void;

	/**
	 * Logs an info-level message.
	 * Info is the default level and is used for general informational messages.
	 *
	 * @param {string} msg - Message template with optional placeholders
	 * @param {...unknown[]} args - Values to replace placeholders
	 */
	info(msg: string, ...args: unknown[]): void;

	/**
	 * Logs a warning-level message.
	 * Warn is used for potentially problematic situations.
	 *
	 * @param {string} msg - Message template with optional placeholders
	 * @param {...unknown[]} args - Values to replace placeholders
	 */
	warn(msg: string, ...args: unknown[]): void;

	/**
	 * Logs an error-level message.
	 * Error is used for error conditions that should be investigated.
	 *
	 * @param {string} msg - Message template with optional placeholders
	 * @param {...unknown[]} args - Values to replace placeholders
	 */
	error(msg: string, ...args: unknown[]): void;

	/**
	 * Logs a fatal-level message.
	 * Fatal is the highest level and indicates a critical failure.
	 *
	 * @param {string} msg - Message template with optional placeholders
	 * @param {...unknown[]} args - Values to replace placeholders
	 */
	fatal(msg: string, ...args: unknown[]): void;

	/**
	 * Logs a debug-level message with lazy evaluation of arguments.
	 * Arguments are only evaluated if debug logging is enabled, improving performance.
	 *
	 * @param {string} msg - Message template with optional placeholders
	 * @param {...Array<() => unknown>} args - Functions that return values to replace placeholders
	 */
	debugLazy(msg: string, ...args: Array<() => unknown>): void;

	/**
	 * Logs a trace-level message with lazy evaluation of arguments.
	 * Arguments are only evaluated if trace logging is enabled, improving performance.
	 *
	 * @param {string} msg - Message template with optional placeholders
	 * @param {...Array<() => unknown>} args - Functions that return values to replace placeholders
	 */
	traceLazy(msg: string, ...args: Array<() => unknown>): void;

	/**
	 * Executes a function and logs any errors that are thrown.
	 *
	 * @template T - The return type of the function
	 * @param {() => T} fn - Function to execute
	 * @param {string} [context] - Optional context description for error messages
	 * @returns {T} The return value of the function
	 */
	capture<T>(fn: () => T, context?: string): T;

	/**
	 * Logs a warning if the given condition is false.
	 * Useful for runtime assertions during development.
	 *
	 * @param {boolean} condition - The condition to check
	 * @param {string} msg - Message template to log if condition is false
	 * @param {...unknown[]} args - Values to replace placeholders
	 */
	assert(condition: boolean, msg: string, ...args: unknown[]): void;

	/**
	 * Starts a timer and returns a callback to log the elapsed time.
	 *
	 * @param {string} label - Label for the timer
	 * @returns {{ done: (msg: string) => void }} Object with a done method to log elapsed time
	 *
	 * @example
	 * const timer = logger.startTimer("database-query");
	 * // ... perform work ...
	 * timer.done("Query completed");
	 */
	startTimer(label: string): { done: (msg: string) => void };

	/**
	 * Creates a new logger with an extended context path.
	 * Useful for organizing logs by component hierarchy.
	 *
	 * @param {string} context - The context to append
	 * @returns {ILogger} A new logger with the extended context
	 */
	ForContext(context: string): ILogger;

	/**
	 * Creates a new logger with an additional property.
	 * Properties are included in all log events from the new logger.
	 *
	 * @param {string} key - The property key
	 * @param {unknown} value - The property value
	 * @returns {ILogger} A new logger with the additional property
	 */
	WithProperty(key: string, value: unknown): ILogger;

	/**
	 * Creates a new logger with multiple additional properties.
	 * Properties are included in all log events from the new logger.
	 *
	 * @param {Record<string, unknown>} props - Object containing property key-value pairs
	 * @returns {ILogger} A new logger with the additional properties
	 */
	WithProperties(props: Record<string, unknown>): ILogger;

	/**
	 * Returns the context string of this logger.
	 *
	 * @returns {string | undefined} The context, or undefined for root logger
	 */
	getContext(): string | undefined;

	/**
	 * Returns all properties attached to this logger.
	 *
	 * @returns {ReadonlyMap<string, unknown>} Immutable map of properties
	 */
	getProperties(): ReadonlyMap<string, unknown>;

	/**
	 * Checks if a log level is currently enabled.
	 * Useful to avoid expensive operations when logging won't occur.
	 *
	 * @param {LogLevel} level - The level to check
	 * @returns {boolean} True if the level would produce log output
	 */
	isEnabled(level: LogLevel): boolean;
}

/**
 * Configuration entry for a single log sink.
 *
 * @interface SinkEntry
 */
export interface SinkEntry {
	/** The sink instance that will receive log events */
	sink: ILogEventSink;

	/** Minimum log level for this sink. Events below this level are ignored */
	minLevel: LogLevel;
}

/**
 * Complete configuration for the logger system.
 *
 * @interface LoggerConfig
 */
export interface LoggerConfig {
	/** Array of sinks with their minimum log levels */
	sinks: SinkEntry[];

	/** Array of enrichers that process events before they reach sinks */
	enrichers: ILogEnricher[];

	/** Global minimum log level. Events below this are ignored */
	minLevel: LogLevel;

	/** Whether logging is currently enabled */
	enabled: boolean;
}
