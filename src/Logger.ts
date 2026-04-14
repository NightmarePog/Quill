import { ILogger, LogEvent } from "./types";
import { LogLevel, isEnabled, levelToString } from "./LogLevel";
import { formatMessage } from "./formatter";
import { LoggerBuilder } from "./LoggerBuilder";
import { LoggerConfigStore } from "./LoggerConfig";
import { copyMap } from "./utils";

const eventPool: LogEvent[] = [];

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

function releaseEvent(event: LogEvent): void {
	event.properties.clear();
	eventPool.push(event);
}

/**
 * Structured logger with Serilog-like API.
 */
export class Logger implements ILogger {
	private constructor(
		private readonly context: string | undefined,
		private readonly properties: Map<string, unknown> = new Map(),
	) {}

	/**
	 * Begins logger configuration.
	 */
	static configure(): LoggerBuilder {
		return new LoggerBuilder();
	}

	/**
	 * Sets global minimum log level.
	 */
	static setMinLevel(level: LogLevel): void {
		LoggerConfigStore.setMinLevel(level);
	}

	/**
	 * Enables logging.
	 */
	static enable(): void {
		LoggerConfigStore.enable();
	}

	/**
	 * Disables logging.
	 */
	static disable(): void {
		LoggerConfigStore.disable();
	}

	/**
	 * Flushes all sinks.
	 */
	static flush(): void {
		LoggerConfigStore.flush();
	}

	/**
	 * Creates a logger with a context.
	 */
	static CreateContext(context: string): Logger {
		return new Logger(context);
	}

	/**
	 * Creates a logger for a class.
	 */
	static ForClass(target: object): Logger {
		return new Logger(tostring(target));
	}

	/**
	 * Creates a logger for current file.
	 */
	static ForFile(): Logger {
		const [source] = debug.info(2, "s") as LuaTuple<[string]>;
		const name = source.split(".").pop() ?? source;
		return new Logger(name);
	}

	/**
	 * Creates a root logger.
	 */
	static Root(): Logger {
		return new Logger(undefined);
	}

	/**
	 * Extends logger context.
	 */
	ForContext(context: string): Logger {
		const fullContext = this.context ? `${this.context}.${context}` : context;
		return new Logger(fullContext, copyMap(this.properties));
	}

	/**
	 * Adds a property to the logger.
	 */
	WithProperty(key: string, value: unknown): Logger {
		const props = copyMap(this.properties);
		props.set(key, value);
		return new Logger(this.context, props);
	}

	/**
	 * Adds multiple properties to the logger.
	 */
	WithProperties(props: Record<string, unknown>): Logger {
		const newProps = copyMap(this.properties);
		for (const [k, v] of pairs(props)) {
			newProps.set(k as string, v);
		}
		return new Logger(this.context, newProps);
	}

	/**
	 * Returns logger context.
	 */
	getContext(): string | undefined {
		return this.context;
	}

	/**
	 * Returns logger properties.
	 */
	getProperties(): ReadonlyMap<string, unknown> {
		return this.properties;
	}

	/**
	 * Checks if level is enabled.
	 */
	isEnabled(level: LogLevel): boolean {
		const config = LoggerConfigStore.get();
		return config.enabled && isEnabled(level, config.minLevel);
	}

	trace(msg: string, ...args: unknown[]): void {
		if (!this.isEnabled(LogLevel.Trace)) return;
		this.emit(LogLevel.Trace, msg, args);
	}

	debug(msg: string, ...args: unknown[]): void {
		if (!this.isEnabled(LogLevel.Debug)) return;
		this.emit(LogLevel.Debug, msg, args);
	}

	info(msg: string, ...args: unknown[]): void {
		if (!this.isEnabled(LogLevel.Info)) return;
		this.emit(LogLevel.Info, msg, args);
	}

	warn(msg: string, ...args: unknown[]): void {
		if (!this.isEnabled(LogLevel.Warn)) return;
		this.emit(LogLevel.Warn, msg, args);
	}

	error(msg: string, ...args: unknown[]): void {
		if (!this.isEnabled(LogLevel.Error)) return;
		this.emit(LogLevel.Error, msg, args);
	}

	fatal(msg: string, ...args: unknown[]): void {
		if (!this.isEnabled(LogLevel.Fatal)) return;
		this.emit(LogLevel.Fatal, msg, args);
	}

	debugLazy(msg: string, ...args: Array<() => unknown>): void {
		if (!this.isEnabled(LogLevel.Debug)) return;
		this.emit(
			LogLevel.Debug,
			msg,
			args.map((fn) => fn()),
		);
	}

	traceLazy(msg: string, ...args: Array<() => unknown>): void {
		if (!this.isEnabled(LogLevel.Trace)) return;
		this.emit(
			LogLevel.Trace,
			msg,
			args.map((fn) => fn()),
		);
	}

	/**
	 * Executes function and logs error if thrown.
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
	 * Logs warning if condition is false.
	 */
	assert(condition: boolean, msg: string, ...args: unknown[]): void {
		if (!condition) {
			this.warn(`Assertion failed: ${msg}`, ...args);
		}
	}

	/**
	 * Starts a timer.
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
