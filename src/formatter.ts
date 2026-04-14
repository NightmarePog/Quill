type FormatValue = string | number | boolean | undefined;

export interface FormatOptions {
	decimals?: number;
	width?: number;
	padChar?: string;
	align?: "left" | "right";
}

function formatValue(val: unknown, opts: FormatOptions = {}): string {
	const { decimals, width, padChar = " ", align = "right" } = opts;

	let result: string;

	if (typeOf(val) === "number") {
		result = decimals !== undefined ? string.format(`%.${decimals}f`, val as number) : tostring(val);
	} else if (typeOf(val) === "Vector3") {
		const v = val as Vector3;
		result = `(${math.round(v.X)}, ${math.round(v.Y)}, ${math.round(v.Z)})`;
	} else if (typeOf(val) === "table") {
		const [ok, json] = pcall(() => game.GetService("HttpService").JSONEncode(val));
		result = ok ? json : tostring(val);
	} else {
		result = tostring(val ?? "nil");
	}

	if (width !== undefined && result.size() < width) {
		const padding = string.rep(padChar, width - result.size());
		result = align === "left" ? result + padding : padding + result;
	}

	return result;
}

function serializeDeep(val: unknown): string {
	const [ok, result] = pcall(() => game.GetService("HttpService").JSONEncode(val));
	return ok ? result : tostring(val);
}

export function formatMessage(template: string, args: unknown[]): string {
	let index = 0;
	return template.gsub("{(@?)([%w_]+)}", (serialize: string, _key: string) => {
		const val = args[index++];

		if (typeIs(val, "table") && (val as Record<string, unknown>)["__fmt"] !== undefined) {
			const entry = val as { value: FormatValue; opts: FormatOptions };
			return formatValue(entry.value, entry.opts);
		}

		return serialize === "@" ? serializeDeep(val) : formatValue(val);
	})[0];
}

export function fmt(value: FormatValue, opts: FormatOptions): { value: FormatValue; opts: FormatOptions; __fmt: true } {
	return { value, opts, __fmt: true };
}
