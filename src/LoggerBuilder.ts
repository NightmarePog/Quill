import { LoggerConfig, ILogEventSink, ILogEnricher } from "./types";
import { LogLevel } from "./LogLevel";
import { LoggerConfigStore } from "./LoggerConfig";

/**
 * Fluent builder for configuring the global logger instance.
 *
 * This class provides a builder pattern API for setting up logging configuration,
 * including sinks (outputs), enrichers, and minimum log levels. All methods return
 * `this` to allow method chaining.
 *
 * @example
 * ```typescript
 * Logger.configure()
 *   .WriteTo(consoleSink, LogLevel.Debug)
 *   .SetMinLevel(LogLevel.Info)
 *   .EnrichWithProperty("app", "MyApp")
 *   .Create();
 * ```
 */
export class LoggerBuilder {
	/**
	 * The logger configuration being built.
	 * @private
	 */
	private config: LoggerConfig = {
		sinks: [],
		enrichers: [],
		minLevel: LogLevel.Info,
		enabled: true,
	};

	/**
	 * Adds a log sink (output destination) to the logger configuration.
	 *
	 * A sink is responsible for handling log events and outputting them to a specific
	 * destination (e.g., console, file, remote server). Multiple sinks can be added,
	 * and each event will be emitted to all sinks that meet the minimum level requirement.
	 *
	 * @param sink - The log event sink implementation
	 * @param minLevel - The minimum log level for this sink. Only events at or above this level will be emitted. Defaults to Trace (all events).
	 * @returns The builder instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * builder.WriteTo(consoleSink, LogLevel.Warn) // Only warn and above
	 *        .WriteTo(fileSink, LogLevel.Info);    // All info and above
	 * ```
	 */
	WriteTo(sink: ILogEventSink, minLevel = LogLevel.Trace): this {
		this.config.sinks.push({ sink, minLevel });
		return this;
	}

	/**
	 * Sets the global minimum log level for the logger.
	 *
	 * Events below this level will be filtered out and not emitted to any sinks,
	 * unless a sink specifies a higher minimum level.
	 *
	 * @param level - The minimum log level
	 * @returns The builder instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * builder.SetMinLevel(LogLevel.Debug) // Only debug and above will be processed
	 * ```
	 */
	SetMinLevel(level: LogLevel): this {
		this.config.minLevel = level;
		return this;
	}

	/**
	 * Adds a static property to all log events via enrichment.
	 *
	 * This is a convenience method for adding simple key-value properties to enrichers.
	 * All log events will include this property in their properties map.
	 *
	 * @param key - The property key
	 * @param value - The property value (can be any type)
	 * @returns The builder instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * builder.EnrichWithProperty("environment", "production")
	 *        .EnrichWithProperty("version", "1.0.0")
	 * ```
	 */
	EnrichWithProperty(key: string, value: unknown): this {
		this.config.enrichers.push({
			Enrich(event) {
				event.properties.set(key, value);
			},
		});
		return this;
	}

	/**
	 * Adds a custom enricher to the logger configuration.
	 *
	 * Enrichers are called for every log event and can modify the event properties
	 * or perform other processing. They are invoked in the order they were added.
	 *
	 * @param enricher - A custom enricher implementation
	 * @returns The builder instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * const customEnricher: ILogEnricher = {
	 *   Enrich(event) {
	 *     event.properties.set("userId", game.Players:FindFirstChild("Player1")?.UserId ?? "unknown");
	 *   }
	 * };
	 * builder.Enrich(customEnricher)
	 * ```
	 */
	Enrich(enricher: ILogEnricher): this {
		this.config.enrichers.push(enricher);
		return this;
	}

	/**
	 * Finalizes the logger configuration and applies it globally.
	 *
	 * This method must be called to complete the configuration process.
	 * After calling this, the global logger will use the configured sinks, enrichers,
	 * and minimum level for all logging operations.
	 *
	 * @example
	 * ```typescript
	 * Logger.configure()
	 *   .WriteTo(consoleSink)
	 *   .SetMinLevel(LogLevel.Info)
	 *   .Create(); // Apply configuration
	 * ```
	 */
	Create(): void {
		LoggerConfigStore.set(this.config);
	}
}
