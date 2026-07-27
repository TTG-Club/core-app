export const SPELL_SELECT_CONFIG = {
  searchPath: '/api/v2/spells/search',
  detailBasePath: '/api/v2/spells',
  searchDebounceMilliseconds: 250,
  page: 0,
  pageSize: 50,
  sorting: 'NAME',
  retryCount: 0,
  placeholder: 'Выбери заклинание',
  cantripLabel: 'Заговор',
  spellLevelSuffix: 'круг',
};

/** Возвращает краткую подпись круга заклинания для выпадающего списка. */
export function getSpellSelectLevelLabel(level: number): string {
  return level === 0
    ? SPELL_SELECT_CONFIG.cantripLabel
    : `${level} ${SPELL_SELECT_CONFIG.spellLevelSuffix}`;
}
