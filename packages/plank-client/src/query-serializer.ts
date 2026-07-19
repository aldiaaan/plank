function isPlainObject(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof Date)
  );
}

function pushParam(search: string[], name: string, value: unknown) {
  if (value === undefined || value === null) return;
  search.push(
    `${encodeURIComponent(name)}=${encodeURIComponent(String(value))}`,
  );
}

/**
 * hey-api's default serializer throws on arrays of objects in query strings.
 * Use deepObject indexing so `sorting: [{ id, desc }]` becomes
 * `sorting[0][id]=…&sorting[0][desc]=…`.
 */
export function querySerializer(
  queryParams: Record<string, unknown>,
): string {
  const search: string[] = [];

  for (const [name, value] of Object.entries(queryParams)) {
    if (value === undefined || value === null) continue;

    if (Array.isArray(value)) {
      if (value.length === 0) continue;

      if (isPlainObject(value[0])) {
        value.forEach((item, index) => {
          if (!isPlainObject(item)) return;
          for (const [key, nested] of Object.entries(item)) {
            pushParam(search, `${name}[${index}][${key}]`, nested);
          }
        });
      } else {
        for (const item of value) {
          pushParam(search, name, item);
        }
      }
    } else if (isPlainObject(value)) {
      for (const [key, nested] of Object.entries(value)) {
        pushParam(search, `${name}[${key}]`, nested);
      }
    } else {
      pushParam(search, name, value);
    }
  }

  return search.join("&");
}
