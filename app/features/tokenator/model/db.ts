import Dexie from 'dexie';

import type { Table } from 'dexie';

export interface TokenatorSetting<T = unknown> {
  key: string;
  value: T;
}

export class TokenatorDB extends Dexie {
  settings!: Table<TokenatorSetting>;

  constructor() {
    super('tokenator');

    this.version(1).stores({
      settings: 'key',
    });
  }
}

export const db = new TokenatorDB();
