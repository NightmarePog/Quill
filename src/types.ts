import { LogLevel } from "./LogLevel";

export interface LogEvent {
	level: LogLevel;
	levelName: string;
	message: string;
	messageTemplate: string;
	context: string | undefined;
	timestamp: number;
	properties: Map<string, unknown>;
}

export interface ILogEventSink {
	Emit(event: LogEvent): void;
	flush?(): void;
}

export interface ILogEnricher {
	Enrich(event: LogEvent): void;
}

export interface ILogger {
	trace(msg: string, ...args: unknown[]): void;
	debug(msg: string, ...args: unknown[]): void;
	info(msg: string, ...args: unknown[]): void;
	warn(msg: string, ...args: unknown[]): void;
	error(msg: string, ...args: unknown[]): void;
	fatal(msg: string, ...args: unknown[]): void;

	debugLazy(msg: string, ...args: Array<() => unknown>): void;
	traceLazy(msg: string, ...args: Array<() => unknown>): void;

	capture<T>(fn: () => T, context?: string): T;
	assert(condition: boolean, msg: string, ...args: unknown[]): void;
	startTimer(label: string): { done: (msg: string) => void };

	ForContext(context: string): ILogger;
	WithProperty(key: string, value: unknown): ILogger;
	WithProperties(props: Record<string, unknown>): ILogger;

	getContext(): string | undefined;
	getProperties(): ReadonlyMap<string, unknown>;
	isEnabled(level: LogLevel): boolean;
}

export interface SinkEntry {
	sink: ILogEventSink;
	minLevel: LogLevel;
}

export interface LoggerConfig {
	sinks: SinkEntry[];
	enrichers: ILogEnricher[];
	minLevel: LogLevel;
	enabled: boolean;
}
