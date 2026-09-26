import type { VttgCompendiumChannel } from '#shared/consts';

import {
  getNextVttgCompendiumVersion,
  getVttgCompendiumVersionApiUrl,
  getVttgCompendiumVersionDataKey,
  isVttgCompendiumRebuildRunning,
  parseVttgCompendiumVersion,
  VTTG_COMPENDIUM_REBUILD_POLL_INTERVAL_MS,
  VTTG_COMPENDIUM_SAVE_ERROR_TITLE,
  VTTG_COMPENDIUM_SUCCESS_MESSAGE,
} from '../model';

/**
 * Версия одного канала компендиума VTTG в админке: текущая версия, состояние
 * пересборки выгрузки и подъём версии. У каналов свои core-api и свои версии,
 * поэтому каждый канал — отдельный вызов со своим кешем.
 *
 * Пока бэк пересобирает выгрузку, состояние перезапрашивается по таймеру —
 * админ видит, когда она закончилась, без F5. Ниже текущей версию поднять
 * нельзя: поле не пускает, а бэк проверяет то же самое на своей стороне.
 *
 * @param channel канал компендиума: dev или prod
 * @returns версия, введённое значение и действия с ними
 */
export function useVttgCompendiumVersion(channel: VttgCompendiumChannel) {
  const $toast = useToast();
  const versionApiUrl = getVttgCompendiumVersionApiUrl(channel);

  // server: false — приватные данные админки грузим на клиенте, где авторизация
  // (cookie → Bearer) гарантированно работает.
  const { data, error, status, refresh } = useFetch(versionApiUrl, {
    key: getVttgCompendiumVersionDataKey(channel),
    server: false,
    lazy: true,
    transform: parseVttgCompendiumVersion,
  });

  const currentVersion = computed(() => data.value?.version ?? null);

  const minimumVersion = computed(() =>
    currentVersion.value === null
      ? undefined
      : getNextVttgCompendiumVersion(currentVersion.value),
  );

  /** Версия, до которой админ собирается поднять; пусто — поле очищено. */
  const nextVersion = ref<number | null>(null);

  const isSaving = ref(false);

  const isRebuilding = computed(
    () => !!data.value && isVttgCompendiumRebuildRunning(data.value.rebuild),
  );

  const canSubmit = computed(
    () =>
      currentVersion.value !== null
      && nextVersion.value !== null
      && Number.isInteger(nextVersion.value)
      && nextVersion.value > currentVersion.value
      && !isSaving.value,
  );

  const { pause, resume } = useIntervalFn(
    refresh,
    VTTG_COMPENDIUM_REBUILD_POLL_INTERVAL_MS,
    { immediate: false },
  );

  // Опрос живёт ровно пока идёт пересборка: её конец приходит этим же опросом
  watch(isRebuilding, (rebuilding) => (rebuilding ? resume() : pause()));

  // Поле предлагает следующую версию; опрос версию не меняет, поэтому ввод
  // админа во время пересборки не затирается
  watch(
    minimumVersion,
    (version) => {
      nextVersion.value = version ?? null;
    },
    { immediate: true },
  );

  /**
   * Поднимает версию до введённой. Бэк сразу запускает пересборку выгрузки.
   * При ошибке перезапрашивает версию: её мог поднять другой админ.
   *
   * @returns `true`, если версия поднята
   */
  async function save(): Promise<boolean> {
    if (!canSubmit.value) {
      return false;
    }

    isSaving.value = true;

    try {
      const savedVersionResponse = await $fetch(versionApiUrl, {
        method: 'PUT',
        body: { version: nextVersion.value },
      });

      data.value = parseVttgCompendiumVersion(savedVersionResponse);

      $toast.add({ color: 'success', title: VTTG_COMPENDIUM_SUCCESS_MESSAGE });

      return true;
    } catch (saveError) {
      consola.error(saveError);

      $toast.add({
        color: 'error',
        title: VTTG_COMPENDIUM_SAVE_ERROR_TITLE,
        description: getUploadErrorMessage(saveError),
      });

      await refresh();

      return false;
    } finally {
      isSaving.value = false;
    }
  }

  // Версия меняется только загрузкой и save — наружу она только для чтения.
  // nextVersion остаётся изменяемым: это v-model поля ввода
  return {
    compendiumVersion: readonly(data),
    error,
    status,
    refresh,
    currentVersion,
    minimumVersion,
    nextVersion,
    isSaving: readonly(isSaving),
    isRebuilding,
    canSubmit,
    save,
  };
}
