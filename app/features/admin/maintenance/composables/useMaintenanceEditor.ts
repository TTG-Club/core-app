import type {
  MaintenanceSettingsUpdate,
  MaintenanceSiteId,
} from '#shared/types';

import { MAINTENANCE_ADMIN_API_PATH } from '#shared/consts';
import { maintenanceSiteSettingsSchema } from '#shared/utils';

import {
  MAINTENANCE_ADMIN_DATA_KEY,
  MAINTENANCE_ADMIN_EMPTY_FORM,
  MAINTENANCE_ADMIN_SAVE_ERROR_TITLE,
  MAINTENANCE_ADMIN_SAVE_SUCCESS_MESSAGE,
} from '../model';

/**
 * Редактор режима «сайт закрыт на обновление» одного сайта: сохранённая
 * настройка, форма с её копией и сохранение. У каждого сайта свои данные и
 * своя форма.
 *
 * @param siteId сайт (`5e24`, `5e14`)
 * @returns сохранённая настройка, форма и действия с ней
 */
export function useMaintenanceEditor(siteId: MaintenanceSiteId) {
  const $toast = useToast();

  // server: false — приватные данные админки грузим на клиенте, где
  // авторизация (cookie → Bearer) гарантированно работает.
  const { data, error, refresh } = useAsyncData(
    `${MAINTENANCE_ADMIN_DATA_KEY}:${siteId}`,
    async () =>
      maintenanceSiteSettingsSchema.parse(
        await $fetch<unknown>(MAINTENANCE_ADMIN_API_PATH, {
          query: { siteId },
        }),
      ),
    { server: false, lazy: true },
  );

  const form = ref<MaintenanceSettingsUpdate>({
    ...MAINTENANCE_ADMIN_EMPTY_FORM,
  });

  const isSaving = ref(false);

  // Форма получает копию сохранённой настройки при загрузке и после сохранения.
  watch(
    data,
    (settings) => {
      if (!settings) {
        return;
      }

      form.value = {
        enabled: settings.enabled,
        title: settings.title,
        message: settings.message,
      };
    },
    { immediate: true },
  );

  const isDirty = computed(
    () =>
      !!data.value
      && (form.value.enabled !== data.value.enabled
        || form.value.title !== data.value.title
        || form.value.message !== data.value.message),
  );

  /** Сохраняет форму; ответ сервера становится сохранённой настройкой. */
  async function save(): Promise<void> {
    if (isSaving.value) {
      return;
    }

    isSaving.value = true;

    try {
      data.value = maintenanceSiteSettingsSchema.parse(
        await $fetch<unknown>(MAINTENANCE_ADMIN_API_PATH, {
          method: 'PUT',
          query: { siteId },
          body: form.value,
        }),
      );

      $toast.add({
        color: 'success',
        title: MAINTENANCE_ADMIN_SAVE_SUCCESS_MESSAGE,
      });
    } catch (saveError) {
      consola.error(saveError);

      $toast.add({
        color: 'error',
        title: MAINTENANCE_ADMIN_SAVE_ERROR_TITLE,
      });
    } finally {
      isSaving.value = false;
    }
  }

  return {
    savedSettings: data,
    loadError: error,
    form,
    isDirty,
    isSaving,
    save,
    refresh,
  };
}
