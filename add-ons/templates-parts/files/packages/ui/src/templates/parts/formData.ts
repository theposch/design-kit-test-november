/* Reads a FormData entry as trimmed text; files and missing keys count as empty. */
export function textOf(data: FormData, key: string) {
  const value = data.get(key);
  return typeof value === 'string' ? value.trim() : '';
}
