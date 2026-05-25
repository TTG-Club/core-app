/**
 * Статусы загрузки данных.
 */
export type FetchStatusValue = 'idle' | 'pending' | 'success' | 'error';

/**
 * Перечисление статусов загрузки данных.
 */
export enum FetchStatus {
  Idle = 'idle',
  Pending = 'pending',
  Success = 'success',
  Error = 'error',
}
