import type { Ref } from 'vue';

import { FetchError } from 'ofetch';

import {
  COMMUNITY_NEWS_ADMIN_TOASTS,
  COMMUNITY_NEWS_API_PATH,
  parseCommunityNewsRequest,
} from '../../model';

/**
 * Текст ошибки запроса: сообщение бэка, а без него — запасной текст.
 *
 * @param error - Пойманная ошибка
 * @param fallback - Текст на случай, если бэк ничего не сообщил
 * @returns Текст для уведомления
 */
function getErrorDescription(error: unknown, fallback: string): string {
  return error instanceof FetchError
    ? (error.data?.message ?? error.message)
    : fallback;
}

/**
 * Действия в списке инструмента публикации: мягкое удаление (скрытие)
 * `DELETE /community-news/{url}` и включение/снятие опубликованной новости.
 */
export function useCommunityNewsAdmin(): {
  deletingUrl: Ref<string | null>;
  togglingUrl: Ref<string | null>;
  deleteNews: (url: string) => Promise<boolean>;
  setActive: (url: string, active: boolean) => Promise<boolean>;
} {
  const $toast = useToast();
  const deletingUrl = ref<string | null>(null);
  const togglingUrl = ref<string | null>(null);

  /**
   * Скрывает новость из публичных списков (мягкое удаление).
   *
   * @param url - Адрес новости
   * @returns Удалось ли скрыть
   */
  async function deleteNews(url: string): Promise<boolean> {
    deletingUrl.value = url;

    try {
      await $fetch(`${COMMUNITY_NEWS_API_PATH}/${url}`, { method: 'delete' });

      $toast.add({
        title: COMMUNITY_NEWS_ADMIN_TOASTS.hiddenTitle,
        description: COMMUNITY_NEWS_ADMIN_TOASTS.hiddenDescription,
        color: 'success',
      });

      return true;
    } catch (error) {
      $toast.add({
        title: COMMUNITY_NEWS_ADMIN_TOASTS.errorTitle,
        description: getErrorDescription(
          error,
          COMMUNITY_NEWS_ADMIN_TOASTS.hideFailed,
        ),
        color: 'error',
      });

      return false;
    } finally {
      deletingUrl.value = null;
    }
  }

  /**
   * Включает или снимает опубликованную новость. Отдельной ручки нет: берём
   * `/raw` и сохраняем всю новость с новым `active` (как у новостей сайта).
   * «Доступна по ссылке» осмыслена только у снятой — при включении гасим её.
   *
   * @param url - Адрес новости
   * @param active - Новое состояние
   * @returns Удалось ли сохранить
   */
  async function setActive(url: string, active: boolean): Promise<boolean> {
    togglingUrl.value = url;

    try {
      const raw = parseCommunityNewsRequest(
        await $fetch(`${COMMUNITY_NEWS_API_PATH}/${url}/raw`),
      );

      await $fetch(`${COMMUNITY_NEWS_API_PATH}/${url}`, {
        method: 'put',
        body: {
          ...raw,
          draft: false,
          active,
          accessibleByLink: active ? false : raw.accessibleByLink,
        },
      });

      $toast.add({
        title: active
          ? COMMUNITY_NEWS_ADMIN_TOASTS.activatedTitle
          : COMMUNITY_NEWS_ADMIN_TOASTS.deactivatedTitle,
        description: active
          ? COMMUNITY_NEWS_ADMIN_TOASTS.activatedDescription
          : COMMUNITY_NEWS_ADMIN_TOASTS.deactivatedDescription,
        color: 'success',
      });

      return true;
    } catch (error) {
      $toast.add({
        title: COMMUNITY_NEWS_ADMIN_TOASTS.errorTitle,
        description: getErrorDescription(
          error,
          COMMUNITY_NEWS_ADMIN_TOASTS.toggleFailed,
        ),
        color: 'error',
      });

      return false;
    } finally {
      togglingUrl.value = null;
    }
  }

  return { deletingUrl, togglingUrl, deleteNews, setActive };
}
