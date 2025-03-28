export function getStringByteSize(str: string) {
  return Buffer.byteLength(str, 'utf8');
}
