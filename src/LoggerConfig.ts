import { LoggerConfig, ILogEventSink, ILogEnricher, SinkEntry } from "./types";
import { LogLevel } from "./LogLevel";

export class LoggerConfigStore {
	private static instance: LoggerConfig = {
		sinks: [],
		enrichers: [],
		minLevel: LogLevel.Info,
		enabled: true,
	};

	static get(): LoggerConfig {
		return this.instance;
	}

	static set(config: LoggerConfig): void {
		this.instance = config;
	}

	static setMinLevel(level: LogLevel): void {
		this.instance.minLevel = level;
	}

	static enable(): void {
		this.instance.enabled = true;
	}

	static disable(): void {
		this.instance.enabled = false;
	}

	static flush(): void {
		for (const { sink } of this.instance.sinks) {
			sink.flush?.();
		}
	}
}
