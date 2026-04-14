import { LoggerConfig, ILogEventSink, ILogEnricher } from "./types";
import { LogLevel } from "./LogLevel";
import { LoggerConfigStore } from "./LoggerConfig";

export class LoggerBuilder {
	private config: LoggerConfig = {
		sinks: [],
		enrichers: [],
		minLevel: LogLevel.Info,
		enabled: true,
	};

	WriteTo(sink: ILogEventSink, minLevel = LogLevel.Trace): this {
		this.config.sinks.push({ sink, minLevel });
		return this;
	}

	SetMinLevel(level: LogLevel): this {
		this.config.minLevel = level;
		return this;
	}

	EnrichWithProperty(key: string, value: unknown): this {
		this.config.enrichers.push({
			Enrich(event) {
				event.properties.set(key, value);
			},
		});
		return this;
	}

	Enrich(enricher: ILogEnricher): this {
		this.config.enrichers.push(enricher);
		return this;
	}

	Create(): void {
		LoggerConfigStore.set(this.config);
	}
}
