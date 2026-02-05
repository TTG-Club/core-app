import { liveQuery } from 'dexie';
import { cloneDeep } from 'es-toolkit';
import { db } from '~tokenator/model';

/**
 * Helper function to sync a ref with Dexie DB.
 * Handles 2-way binding with loop protection.
 */
export function useTokenatorSetting<T>(key: string, defaultValue: T) {
  const data = ref<T>(defaultValue) as Ref<T>;

  let isSyncing = false;

  // Sync from DB (Reactive read)
  if (import.meta.client) {
    liveQuery(async () => {
      const result = await db.settings.get(key);

      return result ? (result.value as T) : defaultValue;
    }).subscribe((val) => {
      isSyncing = true;
      data.value = val;

      nextTick(() => {
        isSyncing = false;
      });
    });
  }

  // Sync to DB (Write on change)
  watch(
    data,
    async (newValue) => {
      if (isSyncing) {
        return;
      }

      // Use raw value to avoid proxy issues and deep clone to ensure data integrity
      const rawValue = cloneDeep(newValue);

      await db.settings.put({ key, value: rawValue });
    },
    { deep: true },
  );

  return { data };
}
