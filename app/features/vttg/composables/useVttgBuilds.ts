import type { VttgBuild, VttgBuildId } from '#shared/types';

import { VTTG_BUILDS_API_PATH, VTTG_BUILDS_DATA_KEY } from '../model';

/**
 * Сборки VTTG (GET /api/vttg/builds).
 *
 * Версии и ссылки нигде не захардкожены: сервер каждый раз читает их из
 * манифестов канала обновлений — тех же, по которым обновляется само
 * приложение. Поэтому после релиза кнопка отдаёт новый файл без правок сайта, а
 * ещё не вышедшая платформа приходит пустой и рисуется как «Скоро».
 *
 * Загрузка ручная (`load`): данные нужны не каждому потребителю (в кабинете —
 * только строке с ранним доступом), а ключ общий, поэтому сколько бы блоков
 * ни было на странице, запрос уйдёт один (`dedupe: 'defer'` — параллельные
 * вызовы ждут уже идущий, а не отменяют его).
 */
export function useVttgBuilds() {
  const { data, status, error, execute, refresh } = useAsyncData<VttgBuild[]>(
    VTTG_BUILDS_DATA_KEY,
    () => $fetch(VTTG_BUILDS_API_PATH, { retry: 0 }),
    { immediate: false, dedupe: 'defer' },
  );

  /** Сборки по идентификатору — строке списка нужна своя, а не весь массив. */
  const buildsById = computed(
    () =>
      new Map<VttgBuildId, VttgBuild>(
        data.value?.map((build) => [build.id, build]),
      ),
  );

  /** Запрашивает сборки, если они ещё не запрашивались в этом визите. */
  function load(): void {
    if (status.value === 'idle') {
      execute();
    }
  }

  return { buildsById, status, error, load, refresh };
}
