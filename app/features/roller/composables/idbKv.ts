import { toRaw } from 'vue';

const IDB_DB_NAME = 'core-app';
const IDB_STORE = 'kv';

let kvDbPromise: Promise<IDBDatabase> | null = null;

function openKvDb(): Promise<IDBDatabase> {
  if (kvDbPromise) {
    return kvDbPromise;
  }

  kvDbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_DB_NAME, 1);

    req.onupgradeneeded = () => {
      const db = req.result;

      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  return kvDbPromise;
}

export async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await openKvDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const store = tx.objectStore(IDB_STORE);

    let out: T | undefined;

    const req = store.get(key);

    req.onsuccess = () => {
      out = req.result as T | undefined;
    };

    req.onerror = () => reject(req.error);

    tx.oncomplete = () => resolve(out);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function idbSet<T>(key: string, value: T): Promise<void> {
  const db = await openKvDb();

  const raw = toRaw(value) as T;

  const payload = structuredClone(raw);

  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);

    store.put(payload as any, key);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
