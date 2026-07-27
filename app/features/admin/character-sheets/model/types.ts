export interface AdminCharacterSheetStats {
  /** Активные (неудалённые) листы всех пользователей. */
  active: number;
  /** Все листы: активные и лежащие в истории удалённых. */
  total: number;
}
