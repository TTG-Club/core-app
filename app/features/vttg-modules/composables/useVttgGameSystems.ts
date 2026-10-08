import type { VttgGameSystem } from '../model';

import { fetchGameSystems, VTTG_MODULES_SYSTEMS_ASYNC_KEY } from '../model';

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

  return { getSystemName };
}
