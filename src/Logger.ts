import { ILogger, LogEvent } from "./types";
import { LogLevel, isEnabled, levelToString } from "./LogLevel";
import { formatMessage } from "./formatter";
import { LoggerBuilder } from "./LoggerBuilder";
import { LoggerConfigStore } from "./LoggerConfig";
import { copyMap } from "./utils";

const eventPool: LogEvent[] = [];

/**
 * Retrieves a LogEvent from the object pool.
 * @internal
 * @returns A LogEvent object, either from the pool or a newly created one
 */
function getEvent(): LogEvent {
	return (
		eventPool.pop() ?? {
			level: LogLevel.Info,
			levelName: "INFO",
			message: "",
			messageTemplate: "",
			context: undefined,
			timestamp: 0,
			properties: new Map(),
		}
	);
}

/**
 * Returns a LogEvent to the object pool for reuse.
 * @internal
 * @param event - The LogEvent to return to the pool
 */
function releaseEvent(event: LogEvent): void {
	event.properties.clear();
	eventPool.push(event);
}

/**
 * A structured logger with a Serilog-like API for logging in Roblox environments.
 *
 * The Logger class provides a fluent, type-safe interface for structured logging
 * with support for contextual information, properties, lazy evaluation, and
 * enrichment pipelines. It uses an object pool for performance optimization.
 *
 * @example
 * // Basic usage
 * const logger = Logger.Root();
 * logger.info("User logged in");
 *
 * @example
 * // With context and properties
 * const logger = Logger.ForClass(MyClass)
 *   .WithProperty("userId", 123)
 *   .WithProperty("version", "1.0");
 * logger.info("Processing request {RequestId}", requestId);
 *
 * @example
 * // Configuration
 * Logger.configure()
 *   .WriteTo(consoleRender)
 *   .SetMinLevel(LogLevel.Debug)
 *   .Create();
 */
export class Logger implements ILogger {
	private constructor(
		private readonly context: string | undefined,
		private readonly properties: Map<string, unknown> = new Map(),
	) {}

	/**
	 * Begins logger configuration using the fluent builder pattern.
	 *
	 * @returns A LoggerBuilder instance for configuring sinks, enrichers, and levels
	 *
	 * @example
	 * Logger.configure()
	 *   .WriteTo(sink)
	 *   .SetMinLevel(LogLevel.Debug)
	 *   .Create();
	 */
	static configure(): LoggerBuilder {
		return new LoggerBuilder();
	}

	/**
	 * Sets the global minimum log level for all loggers.
	 *
	 * @param level - The minimum LogLevel to enforce globally
	 *
	 * @example
	 * Logger.setMinLevel(LogLevel.Warn); // Only warnings and above will be logged
	 */
	static setMinLevel(level: LogLevel): void {
		LoggerConfigStore.setMinLevel(level);
	}

	/**
	 * Enables logging globally.
	 *
	 * When disabled, no log events are emitted to sinks.
	 *
	 * @example
	 * Logger.enable();
	 */
	static enable(): void {
		LoggerConfigStore.enable();
	}

	/**
	 * Disables logging globally.
	 *
	 * When disabled, no log events are emitted to sinks, improving performance
	 * in production environments where logging is not needed.
	 *
	 * @example
	 * Logger.disable();
	 */
	static disable(): void {
		LoggerConfigStore.disable();
	}

	/**
	 * Flushes all registered sinks to ensure all buffered log events are written.
	 *
	 * This is useful when the application is shutting down to ensure no logs are lost.
	 *
	 * @example
	 * Logger.flush(); // Wait for all sinks to finish writing
	 */
	static flush(): void {
		LoggerConfigStore.flush();
	}

	/**
	 * Creates a logger with a specific context string.
	 *
	 * @param context - The context name (e.g., "UserService", "PaymentProcessor")
	 * @returns A new Logger instance with the specified context
	 *
	 * @example
	 * const logger = Logger.CreateContext("AuthModule");
	 */
	static CreateContext(context: string): Logger {
		return new Logger(context);
	}

	/**
	 * Creates a logger for a Roblox class or object.
	 *
	 * The logger context will be the string representation of the object.
	 *
	 * @param target - The object or class to create a logger for
	 * @returns A new Logger instance with the target as context
	 *
	 * @example
	 * class UserService {
	 *   private logger = Logger.ForClass(this);
	 * }
	 */
	static ForClass(target: object): Logger {
		return new Logger(tostring(target));
	}

	/**
	 * Creates a logger for the current file or module.
	 *
	 * Uses Lua debug information to determine the calling file's name.
	 *
	 * @returns A new Logger instance with the file name as context
	 *
	 * @example
	 * const logger = Logger.ForFile(); // Context will be "myScript.ts"
	 */
	static ForFile(): Logger {
		const [source] = debug.info(2, "s") as LuaTuple<[string]>;
		const name = source.split(".").pop() ?? source;
		return new Logger(name);
	}

	/**
	 * Creates a root logger with no context.
	 *
	 * The root logger can be used for application-level logging.
	 *
	 * @returns A new Logger instance with undefined context
	 *
	 * @example
	 * const logger = Logger.Root();
	 * logger.info("Application started");
	 */
	static Root(): Logger {
		return new Logger(undefined);
	}

	/**
	 * Creates a child logger with an extended context.
	 *
	 * The new context is formed by appending the provided context to the current one,
	 * separated by a dot. All properties are copied to the new logger.
	 *
	 * @param context - The context to append
	 * @returns A new Logger instance with extended context
	 *
	 * @example
	 * const serviceLogger = Logger.CreateContext("Service");
	 * const operationLogger = serviceLogger.ForContext("Operation");
	 * // operationLogger context: "Service.Operation"
	 */
	ForContext(context: string): Logger {
		const fullContext = this.context ? `${this.context}.${context}` : context;
		return new Logger(fullContext, copyMap(this.properties));
	}

	/**
	 * Creates a new logger with an additional property added.
	 *
	 * The original logger is not modified. All existing properties are preserved.
	 *
	 * @param key - The property key
	 * @param value - The property value
	 * @returns A new Logger instance with the added property
	 *
	 * @example
	 * const logger = Logger.Root()
	 *   .WithProperty("userId", 123)
	 *   .WithProperty("sessionId", "abc");
	 */
	WithProperty(key: string, value: unknown): Logger {
		const props = copyMap(this.properties);
		props.set(key, value);
		return new Logger(this.context, props);
	}

	/**
	 * Creates a new logger with multiple properties added.
	 *
	 * The original logger is not modified. All existing properties are preserved.
	 *
	 * @param props - An object with key-value pairs to add as properties
	 * @returns A new Logger instance with the added properties
	 *
	 * @example
	 * const logger = Logger.Root()
	 *   .WithProperties({ userId: 123, sessionId: "abc", role: "admin" });
	 */
	WithProperties(props: Record<string, unknown>): Logger {
		const newProps = copyMap(this.properties);
		for (const [k, v] of pairs(props)) {
			newProps.set(k as string, v);
		}
		return new Logger(this.context, newProps);
	}

	/**
	 * Returns the context of this logger.
	 *
	 * @returns The context string, or undefined if this is a root logger
	 *
	 * @example
	 * const logger = Logger.CreateContext("Service");
	 * console.log(logger.getContext()); // "Service"
	 */
	getContext(): string | undefined {
		return this.context;
	}

	/**
	 * Returns a read-only map of all properties associated with this logger.
	 *
	 * @returns The properties map
	 *
	 * @example
	 * const props = logger.getProperties();
	 * for (const [key, value] of props) {
	 *   print(`${key}: ${value}`);
	 * }
	 */
	getProperties(): ReadonlyMap<string, unknown> {
		return this.properties;
	}

	/**
	 * Checks if a specific log level is enabled for this logger.
	 *
	 * @param level - The LogLevel to check
	 * @returns True if the level is enabled and logging is active, false otherwise
	 *
	 * @example
	 * if (logger.isEnabled(LogLevel.Debug)) {
	 *   const expensive = computeDebugInfo();
	 *   logger.debug("Debug info: {Info}", expensive);
	 * }
	 */
	isEnabled(level: LogLevel): boolean {
		const config = LoggerConfigStore.get();
		return config.enabled && isEnabled(level, config.minLevel);
	}

	/**
	 * Logs a message at the Trace level (lowest severity).
	 *
	 * Trace logs are typically used for the most detailed diagnostic information.
	 *
	 * @param msg - The message template with {placeholders} for arguments
	 * @param args - Values to substitute into the message template
	 *
	 * @example
	 * logger.trace("Entering function {FunctionName}", "myFunction");
	 */
	trace(msg: string, ...args: unknown[]): void {
		if (!this.isEnabled(LogLevel.Trace)) return;
		this.emit(LogLevel.Trace, msg, args);
	}

	/**
	 * Logs a message at the Debug level.
	 *
	 * Debug logs are useful for development and troubleshooting.
	 *
	 * @param msg - The message template with {placeholders} for arguments
	 * @param args - Values to substitute into the message template
	 *
	 * @example
	 * logger.debug("Parsed config: {Config}", config);
	 */
	debug(msg: string, ...args: unknown[]): void {
		if (!this.isEnabled(LogLevel.Debug)) return;
		this.emit(LogLevel.Debug, msg, args);
	}

	/**
	 * Logs a message at the Info level.
	 *
	 * Info logs provide general informational messages about application flow.
	 *
	 * @param msg - The message template with {placeholders} for arguments
	 * @param args - Values to substitute into the message template
	 *
	 * @example
	 * logger.info("User {UserId} logged in", userId);
	 */
	info(msg: string, ...args: unknown[]): void {
		if (!this.isEnabled(LogLevel.Info)) return;
		this.emit(LogLevel.Info, msg, args);
	}

	/**
	 * Logs a message at the Warn level.
	 *
	 * Warn logs indicate potentially harmful situations that should be reviewed.
	 *
	 * @param msg - The message template with {placeholders} for arguments
	 * @param args - Values to substitute into the message template
	 *
	 * @example
	 * logger.warn("Slow query detected: {Duration}ms", queryTime);
	 */
	warn(msg: string, ...args: unknown[]): void {
		if (!this.isEnabled(LogLevel.Warn)) return;
		this.emit(LogLevel.Warn, msg, args);
	}

	/**
	 * Logs a message at the Error level.
	 *
	 * Error logs indicate error conditions that may need attention.
	 *
	 * @param msg - The message template with {placeholders} for arguments
	 * @param args - Values to substitute into the message template
	 *
	 * @example
	 * logger.error("Failed to save user {UserId}: {Error}", userId, error);
	 */
	error(msg: string, ...args: unknown[]): void {
		if (!this.isEnabled(LogLevel.Error)) return;
		this.emit(LogLevel.Error, msg, args);
	}

	/**
	 * Logs a message at the Fatal level (highest severity).
	 *
	 * Fatal logs indicate severe errors that may cause application shutdown.
	 *
	 * @param msg - The message template with {placeholders} for arguments
	 * @param args - Values to substitute into the message template
	 *
	 * @example
	 * logger.fatal("Database connection failed, shutting down");
	 */
	fatal(msg: string, ...args: unknown[]): void {
		if (!this.isEnabled(LogLevel.Fatal)) return;
		this.emit(LogLevel.Fatal, msg, args);
	}

	/**
	 * Logs a Debug level message with lazy argument evaluation.
	 *
	 * Arguments passed as functions are only called if Debug logging is enabled,
	 * avoiding expensive computations when the log level is too high.
	 *
	 * @param msg - The message template with {placeholders} for arguments
	 * @param args - Functions that return values to substitute into the template
	 *
	 * @example
	 * logger.debugLazy("User data: {User}", () => expensiveUserLookup());
	 */
	debugLazy(msg: string, ...args: Array<() => unknown>): void {
		if (!this.isEnabled(LogLevel.Debug)) return;
		this.emit(
			LogLevel.Debug,
			msg,
			args.map((fn) => fn()),
		);
	}

	/**
	 * Logs a Trace level message with lazy argument evaluation.
	 *
	 * Arguments passed as functions are only called if Trace logging is enabled,
	 * avoiding expensive computations when the log level is too high.
	 *
	 * @param msg - The message template with {placeholders} for arguments
	 * @param args - Functions that return values to substitute into the template
	 *
	 * @example
	 * logger.traceLazy("Detailed state: {State}", () => serializeComplexState());
	 */
	traceLazy(msg: string, ...args: Array<() => unknown>): void {
		if (!this.isEnabled(LogLevel.Trace)) return;
		this.emit(
			LogLevel.Trace,
			msg,
			args.map((fn) => fn()),
		);
	}

	/**
	 * Executes a function and logs any errors that are thrown.
	 *
	 * If the function throws an error, it is logged at Error level and then re-thrown.
	 * If the function succeeds, the result is returned.
	 *
	 * @template T - The return type of the function
	 * @param fn - The function to execute
	 * @param context - Optional context description for the error log
	 * @returns The result of the function, or undefined if an error occurred
	 *
	 * @example
	 * const result = logger.capture(() => {
	 *   return dangerousOperation();
	 * }, "DangerousOp");
	 */
	capture<T>(fn: () => T, context?: string): T {
		const [ok, result] = pcall(fn);
		if (!ok) {
			this.error("Error captured in {Context}: {Error}", context ?? "unknown", result);
			error(result, 2);
		}
		return result as T;
	}

	/**
	 * Asserts a condition and logs a warning if the condition is false.
	 *
	 * Unlike typical assertions, this does not throw an error but instead logs
	 * a warning message, making it suitable for runtime validation.
	 *
	 * @param condition - The condition to check
	 * @param msg - The message template to log if the assertion fails
	 * @param args - Values to substitute into the message template
	 *
	 * @example
	 * logger.assert(user !== undefined, "User {UserId} not found", userId);
	 */
	assert(condition: boolean, msg: string, ...args: unknown[]): void {
		if (!condition) {
			this.warn(`Assertion failed: ${msg}`, ...args);
		}
	}

	/**
	 * Starts a timer that measures elapsed time until completion.
	 *
	 * Returns an object with a `done()` method that logs the elapsed time when called.
	 *
	 * @param label - A label to identify the operation being timed
	 * @returns An object with a `done(msg: string)` method to log completion
	 *
	 * @example
	 * const timer = logger.startTimer("DatabaseQuery");
	 * await executeQuery();
	 * timer.done("Query completed in {Label}: {Duration}ms");
	 * // Logs: "Query completed in DatabaseQuery: 125ms"
	 */
	startTimer(label: string): { done: (msg: string) => void } {
		const start = os.clock();
		return {
			done: (msg: string) => {
				const elapsed = math.round((os.clock() - start) * 1000);
				this.info(`${msg} [{Label}] {Duration}ms`, label, elapsed);
			},
		};
	}

	/**
	 * Internal method that emits a log event to all configured sinks.
	 *
	 * This method:
	 * 1. Gets an event from the pool
	 * 2. Populates it with log data
	 * 3. Passes it through enrichers
	 * 4. Sends it to all sinks that are enabled for this level
	 * 5. Returns the event to the pool
	 *
	 * @internal
	 * @param level - The log level
	 * @param msg - The message template
	 * @param args - The arguments to substitute
	 */
	private emit(level: LogLevel, msg: string, args: unknown[]): void {
		const config = LoggerConfigStore.get();
		const event = getEvent();

		event.level = level;
		event.levelName = levelToString(level);
		event.messageTemplate = msg;
		event.message = formatMessage(msg, args);
		event.context = this.context;
		event.timestamp = os.time();

		for (const [k, v] of this.properties) {
			event.properties.set(k, v);
		}

		for (const enricher of config.enrichers) {
			enricher.Enrich(event);
		}

		for (const { sink, minLevel } of config.sinks) {
			if (isEnabled(level, minLevel)) {
				sink.Emit(event);
			}
		}

		releaseEvent(event);
	}
}
