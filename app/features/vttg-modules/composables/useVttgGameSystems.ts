import type { VttgGameSystem } from '../model';

import {
  CARD_UNIVERSAL_LABEL,
  fetchGameSystems,
  VTTG_MODULES_SYSTEMS_ASYNC_KEY,
} from '../model';

/**
 * Справочник игровых систем реестра: названия систем для карточек. Сами
 * системы модуля приходят из его манифеста. Один запрос на страницу — ключ
 * общий.
 */
export function useVttgGameSystems() {
  const { data: systems } = useAsyncData(
    VTTG_MODULES_SYSTEMS_ASYNC_KEY,
    () => fetchGameSystems(),
    { server: false, default: (): Array<VttgGameSystem> => [] },
  );

  /**
   * Название системы по id; незнакомый id показываем как есть.
   * @param systemId Идентификатор системы.
   */
  function getSystemName(systemId: string): string {
    return (
      systems.value.find((system) => system.id === systemId)?.name ?? systemId
    );
  }

  /**
   * Подписи систем модуля для значков; у универсального модуля — одна общая.
   * @param systemIds Идентификаторы систем из манифеста модуля.
   */
  function getSystemNames(systemIds: Array<string>): Array<string> {
    return systemIds.length > 0
      ? systemIds.map(getSystemName)
      : [CARD_UNIVERSAL_LABEL];
  }

  return { getSystemName, getSystemNames };
}
