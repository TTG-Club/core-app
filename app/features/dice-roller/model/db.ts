import Dexie from 'dexie';
import { del, get } from 'idb-keyval';

import { DICE_HISTORY_STORAGE_KEY } from '../const';

import type { Table } from 'dexie';

import type { HistoryEntry } from '../types';

export class DiceRollerDB extends Dexie {
  history!: Table<HistoryEntry>;

  constructor() {
    super('dice-roller');

    this.version(1).stores({
      history: 'id, timestamp',
    });
  }
}

export const db = new DiceRollerDB();

export async function migrateFromIdbKeyval() {
  if (!import.meta.client) {
    return;
  }

  try {
    const oldHistory = await get<HistoryEntry[]>(DICE_HISTORY_STORAGE_KEY);

    if (oldHistory && Array.isArray(oldHistory) && oldHistory.length > 0) {
      await db.transaction('rw', db.history, async () => {
        // Ensure we handle potential duplicate keys if any, though unlikely in a fresh DB
        await db.history.bulkPut(oldHistory);
      });

      await del(DICE_HISTORY_STORAGE_KEY);
    }
  } catch (error) {
    console.error('Failed to migrate Dice Roller history:', error);
  }
}

// Start migration automatically on client side
if (import.meta.client) {
  migrateFromIdbKeyval();
}
