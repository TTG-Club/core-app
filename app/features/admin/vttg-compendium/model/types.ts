/** Состояние пересборки выгрузки VTTG после смены версии. */
export type VttgCompendiumRebuildStatus =
  | 'IDLE'
  | 'RUNNING'
  | 'DONE'
  | 'FAILED';

/** Последняя пересборка выгрузки: когда шла и чем закончилась. */
export interface VttgCompendiumRebuild {
  status: VttgCompendiumRebuildStatus;
  startedAt: string | null;
  finishedAt: string | null;
  error: string | null;
}

/**
 * Версия компендиума VTTG — `schemaVersion` ответа `/changes`. Клиент VTTG,
 * увидев новую, перекачивает компендиум целиком.
 */
export interface VttgCompendiumVersion {
  version: number;
  updatedAt: string | null;
  updatedBy: string | null;
  rebuild: VttgCompendiumRebuild;
}
