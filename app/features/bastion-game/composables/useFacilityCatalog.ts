import { fetchFacilityCatalog } from '../model';

/**
 * Справочник сооружений бастиона для экрана выбора. Один запрос на страницу:
 * ключ общий, и панели выбора разных персонажей делят загруженный список.
 *
 * @returns Справочник и состояние загрузки.
 */
export function useFacilityCatalog() {
  const { data, status, refresh } = useAsyncData(
    'bastion-facility-catalog',
    fetchFacilityCatalog,
    { server: false, lazy: true, dedupe: 'defer', default: () => [] },
  );

  return { catalog: data, status, refresh };
}
