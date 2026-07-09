import type { Ref } from 'vue';

import { FetchError } from 'ofetch';

import { ARTICLES_API_PATH } from '../../model';

/** Состояние проверки доступности slug. */
export type SlugAvailability =
  | 'idle'
  | 'checking'
  | 'free'
  | 'taken'
  | 'own'
  | 'error';

/** Задержка перед проверкой, мс (пока пользователь печатает). */
const SLUG_CHECK_DEBOUNCE = 400;

/**
 * Определяет, что ошибка запроса — это 404 (slug свободен).
 */
function isNotFoundError(error: unknown): boolean {
  return error instanceof FetchError && error.statusCode === 404;
}

/**
 * Проверяет доступность slug через `HEAD /articles/{url}`:
 * 200 — занят (в т.ч. черновиком, отложенной или удалённой записью),
 * 404 — свободен. При редактировании собственный url записи занятым не считается.
 *
 * Эндпоинт `@Secured` (только ADMIN/MODERATOR). Отдельно слать токен не нужно:
 * запрос идёт на относительный `/api/v2/...` через серверный прокси, а middleware
 * `appendAuthHeader` подставляет `Authorization: Bearer <token>` из httpOnly-cookie
 * — тем же путём, что и все прочие admin-запросы (POST/PUT/GET `/raw`). Ответ без
 * токена (401/403) попадает в ветку `error` и не блокирует сохранение (проверка
 * доступности — подсказка, а не валидатор формы).
 */
export function useSlugAvailability(
  slug: Ref<string>,
  currentUrl: Ref<string | undefined>,
): { availability: Ref<SlugAvailability> } {
  const availability = ref<SlugAvailability>('idle');

  async function check(value: string): Promise<void> {
    try {
      await $fetch(`${ARTICLES_API_PATH}/${value}`, { method: 'HEAD' });

      // Пока ждали ответ, slug мог смениться — применяем только актуальный.
      if (value === slug.value) {
        availability.value = 'taken';
      }
    } catch (error) {
      if (value !== slug.value) {
        return;
      }

      availability.value = isNotFoundError(error) ? 'free' : 'error';
    }
  }

  const debouncedCheck = useDebounceFn(check, SLUG_CHECK_DEBOUNCE);

  // Следим и за currentUrl: после создания записи url приходит из ответа
  // (undefined → «<slug>»), slug при этом не меняется — без этого подсказка
  // застыла бы на «URL свободен» вместо «Текущий URL записи».
  watch(
    [slug, currentUrl],
    ([value, own]) => {
      const normalized = value.trim();

      if (!normalized) {
        availability.value = 'idle';

        return;
      }

      if (own && normalized === own) {
        availability.value = 'own';

        return;
      }

      availability.value = 'checking';
      debouncedCheck(normalized);
    },
    { immediate: true },
  );

  return { availability };
}
