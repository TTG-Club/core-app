/**
 * Размер строки в байтах: длина в символах ничего не говорит о кириллице,
 * где каждый символ занимает по два байта.
 *
 * @param value Строка.
 */
export function getStringByteSize(value: string): number {
  return Buffer.byteLength(value, 'utf8');
}
