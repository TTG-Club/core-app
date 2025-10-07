export function getSeoImageUrl(url: MaybeRefOrGetter<string | undefined>) {
  const maybeUrl = toValue(url);

  if (!maybeUrl) {
    return undefined;
  }

  if (maybeUrl.startsWith('http')) {
    return maybeUrl;
  }

  if (maybeUrl.startsWith('/')) {
    const origin = getOrigin();

    return `${origin}${maybeUrl}`;
  }

  return undefined;
}
