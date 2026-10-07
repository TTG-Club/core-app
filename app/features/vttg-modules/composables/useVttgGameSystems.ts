import type { VttgGameSystem } from '../model';

import { fetchGameSystems } from '../model';

/**
 * Справочник игровых систем реестра: варианты для формы заявки и подписи
 * систем на карточках. Один запрос на страницу — ключ общий.
 */
export function useVttgGameSystems() {
  const { data: systems, status } = useAsyncData(
    'vttg-modules-game-systems',
    () => fetchGameSystems(),
    { server: false, default: (): Array<VttgGameSystem> => [] },
  );

  const isLoading = computed(() => status.value === 'pending');

  const systemItems = computed(() =>
    systems.value.map((system) => ({ value: system.id, label: system.name })),
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

  return { systemItems, isLoading, getSystemName };
}
