import type { Ref } from 'vue';

import type { ArticleRequest } from '../../model';

import { FetchError } from 'ofetch';

import { ARTICLES_API_PATH } from '../../model';

/**
 * Мутации записей в админ-панели: мягкое удаление (скрытие) через
 * `DELETE /articles/{url}` и переключение активности опубликованной записи.
 */
export function useArticleAdmin(): {
  deletingUrl: Ref<string | null>;
  togglingUrl: Ref<string | null>;
  deleteArticle: (url: string) => Promise<boolean>;
  setActive: (url: string, active: boolean) => Promise<boolean>;
} {
  const $toast = useToast();
  const deletingUrl = ref<string | null>(null);
  const togglingUrl = ref<string | null>(null);

  async function deleteArticle(url: string): Promise<boolean> {
    deletingUrl.value = url;

    try {
      await $fetch(`${ARTICLES_API_PATH}/${url}`, { method: 'delete' });

      $toast.add({
        title: 'Запись скрыта',
        description: 'Запись убрана из публичных списков',
        color: 'success',
      });

      return true;
    } catch (error) {
      const description =
        error instanceof FetchError
          ? (error.data?.message ?? error.message)
          : 'Не удалось скрыть запись';

      $toast.add({
        title: 'Ошибка',
        description,
        color: 'error',
      });

      return false;
    } finally {
      deletingUrl.value = null;
    }
  }

  // Активна/неактивна: спец-ручки в контракте нет, поэтому тянем /raw и PUT-им
  // всю запись с новым `active`. draft=false — тумблер только у опубликованных.
  async function setActive(url: string, active: boolean): Promise<boolean> {
    togglingUrl.value = url;

    try {
      const raw = await $fetch<ArticleRequest>(
        `${ARTICLES_API_PATH}/${url}/raw`,
      );

      await $fetch(`${ARTICLES_API_PATH}/${url}`, {
        method: 'put',
        body: { ...raw, draft: false, active },
      });

      $toast.add({
        title: active ? 'Снова активна' : 'Снята с публикации',
        description: active
          ? 'Запись снова доступна на сайте'
          : 'Запись убрана с сайта, но осталась опубликованной',
        color: 'success',
      });

      return true;
    } catch (error) {
      const description =
        error instanceof FetchError
          ? (error.data?.message ?? error.message)
          : 'Не удалось изменить активность записи';

      $toast.add({
        title: 'Ошибка',
        description,
        color: 'error',
      });

      return false;
    } finally {
      togglingUrl.value = null;
    }
  }

  return { deletingUrl, togglingUrl, deleteArticle, setActive };
}
