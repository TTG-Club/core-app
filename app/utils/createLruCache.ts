/**
 * Простой LRU-кэш на основе Map.
 * При превышении максимального размера удаляет самый старый элемент.
 *
 * @param maxSize Максимальное количество элементов в кэше.
 */
export function createLruCache<K, V>(maxSize: number): Map<K, V> {
  const cache = new Map<K, V>();

  const originalSet = cache.set.bind(cache);
  const originalGet = cache.get.bind(cache);

  cache.get = (key: K): V | undefined => {
    if (!cache.has(key)) {
      return undefined;
    }

    const value = originalGet(key);

    // Перемещаем элемент в конец (самый свежий)
    cache.delete(key);
    originalSet(key, value as V);

    return value;
  };

  cache.set = (key: K, value: V): Map<K, V> => {
    if (cache.has(key)) {
      cache.delete(key);
    }

    originalSet(key, value);

    if (cache.size > maxSize) {
      const oldestKey = cache.keys().next().value;

      if (oldestKey !== undefined) {
        cache.delete(oldestKey);
      }
    }

    return cache;
  };

  return cache;
}
