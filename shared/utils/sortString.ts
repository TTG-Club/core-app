export function sortString(a: string, b: string) {
  return a.localeCompare(b, 'ru', { numeric: true, ignorePunctuation: true });
}
