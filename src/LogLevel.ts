// src/shared/logger/LogLevel.ts

export enum LogLevel {
	Trace = 0,
	Debug = 1,
	Info = 2,
	Warn = 3,
	Error = 4,
	Fatal = 5,
	Off = 6,
}

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

export function isEnabled(current: LogLevel, min: LogLevel): boolean {
	return current !== LogLevel.Off && current >= min;
}

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

export function levelToPrefix(level: LogLevel): string {
	const color = levelToColor(level);
	const name = levelToString(level);
	return `<font color="${color}">[${name}]</font>`;
}
