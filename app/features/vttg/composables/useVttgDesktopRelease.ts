import type { VttgDesktopRelease } from '#shared/types';

import {
  VTTG_DESKTOP_RELEASE_API_PATH,
  VTTG_DESKTOP_RELEASE_DATA_KEY,
} from '../model';

/**
 * Последняя сборка десктопного VTTG (GET /api/vttg/desktop/latest).
 *
 * Версия и ссылка нигде не захардкожены: сервер каждый раз читает их из манифеста
 * канала обновлений — того же, по которому обновляется само приложение. Поэтому
 * после релиза кнопка «Скачать» отдаёт новый установщик без правок сайта.
 *
 * Загрузка ручная (`load`): данные нужны не каждому потребителю (в кабинете —
 * только строке с ранним доступом), а ключ общий, поэтому сколько бы строк
 * ни было на странице, запрос уйдёт один (`dedupe: 'defer'` — параллельные
 * вызовы ждут уже идущий, а не отменяют его).
 */
export function useVttgDesktopRelease() {
  const { data, status, error, execute } = useAsyncData<VttgDesktopRelease>(
    VTTG_DESKTOP_RELEASE_DATA_KEY,
    () => $fetch(VTTG_DESKTOP_RELEASE_API_PATH, { retry: 0 }),
    { immediate: false, dedupe: 'defer' },
  );

  /** Запрашивает манифест, если он ещё не запрашивался в этом визите. */
  function load(): void {
    if (status.value === 'idle') {
      execute();
    }
  }

  return { release: data, error, load };
}
