/**
 * @fileoverview Roblox structured logger module with Serilog-like API.
 *
 * This module provides a comprehensive logging system for Roblox applications,
 * featuring structured logging, context management, enrichment pipelines,
 * and multiple output sinks.
 *
 * @example
 * ```typescript
 * // Configure the logger
 * Logger.configure()
 *   .WriteTo(consoleSink)
 *   .SetMinLevel(LogLevel.Debug)
 *   .Create();
 *
 * // Create a logger for your module
 * const logger = Logger.ForFile();
 *
 * // Use it for logging
 * logger.info("Application started");
 * logger.warn("Performance degradation detected: {Duration}ms", queryTime);
 * logger.error("Operation failed: {Error}", error);
 * ```
 *
 * @module Logger
 */

export { Logger } from "./Logger";
export { LoggerBuilder } from "./LoggerBuilder";
export { LogLevel, levelToString, levelFromString, isEnabled, levelToColor, levelToPrefix } from "./LogLevel";
export { formatMessage, fmt, FormatOptions } from "./formatter";
export type { ILogger, ILogEventSink, ILogEnricher, LogEvent, LoggerConfig, SinkEntry } from "./types";
