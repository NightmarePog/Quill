export function copyMap<K, V>(source: Map<K, V>): Map<K, V> {
	const result = new Map<K, V>();
	source.forEach((value, key) => {
		result.set(key, value);
	});
	return result;
}
