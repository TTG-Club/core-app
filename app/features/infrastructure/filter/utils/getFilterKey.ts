export function getFilterKey(key: string): string {
  if (!key) {
    throw new Error('Filter key is empty');
  }

  return key.startsWith('filter-') ? key : `filter-${key}`;
}
