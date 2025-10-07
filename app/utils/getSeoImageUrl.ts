export function getSeoImageUrl(url: MaybeRefOrGetter<string | undefined>) {
  const value = toValue(url);

  if (!value) return undefined;

  if (value.startsWith('/')) {
    return `${getOrigin()}${value}`;
  }

  if (value.startsWith('http')) {
    return value;
  }

  consola.warn(`[getSeoImageUrl]: "${value}" is not valid url`);

  return undefined;
}
