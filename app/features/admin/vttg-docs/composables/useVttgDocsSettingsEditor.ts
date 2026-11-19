import type { VttgDocsSettingsUpdate } from '#shared/types';

import { xor } from 'es-toolkit';

import { VTTG_DOCS_ADMIN_API_PATH } from '#shared/consts';
import { vttgDocsSettingsSchema } from '#shared/utils';

import {
  VTTG_DOCS_ADMIN_DATA_KEY,
  VTTG_DOCS_ADMIN_SAVE_ERROR_TITLE,
  VTTG_DOCS_ADMIN_SAVE_SUCCESS_MESSAGE,
} from '../model';

/**
 * Редактор настройки документации VTTG: сохранённая настройка, форма с её
 * копией и сохранение. Сохранённую настройку и признак сохранения меняет только
 * сам редактор, наружу они отдаются для чтения; форму правит компонент.
 *
 * @returns сохранённая настройка, форма и действия с ней
 */
export function useVttgDocsSettingsEditor() {
  const $toast = useToast();

  // server: false — приватные данные админки грузим на клиенте, где
  // авторизация (cookie → Bearer) гарантированно работает.
  const {
    data: savedSettings,
    error: loadError,
    refresh,
  } = useAsyncData(
    VTTG_DOCS_ADMIN_DATA_KEY,
    async () =>
      vttgDocsSettingsSchema.parse(
        await $fetch<unknown>(VTTG_DOCS_ADMIN_API_PATH),
      ),
    { server: false, lazy: true },
  );

  const settingsForm = ref<VttgDocsSettingsUpdate>({ devChannelRoles: [] });
  const isSaving = ref(false);

  // Форма получает копию сохранённой настройки при загрузке и после сохранения.
  // Цикла нет: вотчер меняет только форму, а настройку — только `save`.
  whenever(
    savedSettings,
    (loadedSettings) => {
      settingsForm.value = {
        devChannelRoles: [...loadedSettings.devChannelRoles],
      };
    },
    { immediate: true },
  );

  // Наборы ролей без повторов: порядок выбора не делает форму изменённой.
  const isDirty = computed(
    () =>
      !!savedSettings.value
      && xor(
        settingsForm.value.devChannelRoles,
        savedSettings.value.devChannelRoles,
      ).length > 0,
  );

  /** Сохраняет форму; ответ сервера становится сохранённой настройкой. */
  async function save(): Promise<void> {
    if (isSaving.value) {
      return;
    }

    isSaving.value = true;

    try {
      savedSettings.value = vttgDocsSettingsSchema.parse(
        await $fetch<unknown>(VTTG_DOCS_ADMIN_API_PATH, {
          method: 'PUT',
          body: settingsForm.value,
        }),
      );

      $toast.add({
        color: 'success',
        title: VTTG_DOCS_ADMIN_SAVE_SUCCESS_MESSAGE,
      });
    } catch (saveError) {
      consola.error(saveError);

      $toast.add({ color: 'error', title: VTTG_DOCS_ADMIN_SAVE_ERROR_TITLE });
    } finally {
      isSaving.value = false;
    }
  }

  return {
    savedSettings: readonly(savedSettings),
    loadError,
    settingsForm,
    isDirty,
    isSaving: readonly(isSaving),
    save,
    refresh,
  };
}
