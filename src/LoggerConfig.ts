import { LoggerConfig, ILogEventSink, ILogEnricher, SinkEntry } from "./types";
import { LogLevel } from "./LogLevel";

/**
 * Singleton store for global logger configuration.
 *
 * This class manages the global logger configuration state, including sinks, enrichers,
 * and minimum log level settings. It provides methods to get, set, and modify the
 * configuration at runtime.
 *
 * @class LoggerConfigStore
 * @example
 * // Get current configuration
 * const config = LoggerConfigStore.get();
 *
 * // Set minimum log level
 * LoggerConfigStore.setMinLevel(LogLevel.Debug);
 *
 * // Enable or disable logging
 * LoggerConfigStore.enable();
 * LoggerConfigStore.disable();
 */
export class LoggerConfigStore {
	/**
	 * Static instance holding the current logger configuration.
	 *
	 * @private
	 * @static
	 * @type {LoggerConfig}
	 */
	private static instance: LoggerConfig = {
		sinks: [],
		enrichers: [],
		minLevel: LogLevel.Info,
		enabled: true,
	};

	/**
	 * Retrieves the current global logger configuration.
	 *
	 * @static
	 * @returns {LoggerConfig} The current logger configuration object containing sinks, enrichers, and settings.
	 * @example
	 * const config = LoggerConfigStore.get();
	 * console.log(config.minLevel); // LogLevel.Info
	 */
	static get(): LoggerConfig {
		return this.instance;
	}

	/**
	 * Sets the entire logger configuration, replacing the current one.
	 *
	 * This method allows you to replace the complete logger configuration at once,
	 * including all sinks, enrichers, and log level settings.
	 *
	 * @static
	 * @param {LoggerConfig} config - The new logger configuration to apply
	 * @returns {void}
	 * @example
	 * const newConfig: LoggerConfig = {
	 *   sinks: [{ sink: mySink, minLevel: LogLevel.Debug }],
	 *   enrichers: [myEnricher],
	 *   minLevel: LogLevel.Debug,
	 *   enabled: true
	 * };
	 * LoggerConfigStore.set(newConfig);
	 */
	static set(config: LoggerConfig): void {
		this.instance = config;
	}

	/**
	 * Sets the global minimum log level for all sinks.
	 *
	 * This method updates only the minimum log level without affecting other
	 * configuration settings. Messages with a level lower than the specified
	 * level will be filtered out globally.
	 *
	 * @static
	 * @param {LogLevel} level - The new minimum log level to apply
	 * @returns {void}
	 * @example
	 * // Only log warnings and above
	 * LoggerConfigStore.setMinLevel(LogLevel.Warn);
	 */
	static setMinLevel(level: LogLevel): void {
		this.instance.minLevel = level;
	}

	/**
	 * Enables global logging.
	 *
	 * When enabled, the logger will process and emit log events according to
	 * the configured sinks and enrichers. Use this to resume logging after
	 * it has been disabled.
	 *
	 * @static
	 * @returns {void}
	 * @example
	 * LoggerConfigStore.enable();
	 */
	static enable(): void {
		this.instance.enabled = true;
	}

	/**
	 * Disables global logging.
	 *
	 * When disabled, the logger will not process or emit any log events,
	 * effectively silencing all logging throughout the application.
	 *
	 * @static
	 * @returns {void}
	 * @example
	 * LoggerConfigStore.disable();
	 */
	static disable(): void {
		this.instance.enabled = false;
	}

	/**
	 * Flushes all registered sinks.
	 *
	 * This method calls the flush method on all configured sinks that support it.
	 * Use this to ensure all pending log events are written to their destinations
	 * before shutting down or switching contexts.
	 *
	 * @static
	 * @returns {void}
	 * @example
	 * // Before application shutdown
	 * LoggerConfigStore.flush();
	 */
	static flush(): void {
		for (const { sink } of this.instance.sinks) {
			sink.flush?.();
		}
	}
}
