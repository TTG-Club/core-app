import type { ComputedRef, Ref } from 'vue';

import { COMMENTS_MY_COUNT_PATH, parseCommentsCount } from '../model';

/** Возвращаемое значение композабла useMyCommentsCount. */
export interface UseMyCommentsCountReturn {
  /**
   * Число опубликованных комментариев пользователя. `null` — счётчик
   * недоступен (гость, протухший токен или сервис без эндпоинта `/my/count`):
   * потребитель прячет плитку, а не показывает ложный ноль.
   */
  myCommentsCount: ComputedRef<number | null>;

  /** Состояние загрузки запроса. */
  pending: Ref<boolean>;

  /** Ошибка выполнения запроса. */
  error: Ref<unknown>;
}

/**
 * Число комментариев, оставленных текущим пользователем, — для статистики
 * профиля.
 */
export function useMyCommentsCount(): UseMyCommentsCountReturn {
  const {
    data: countResponse,
    pending,
    error,
  } = useFetch(COMMENTS_MY_COUNT_PATH, {
    lazy: true,
    server: false,
    retry: 0,
  });

  const myCommentsCount = computed(() => {
    if (error.value || countResponse.value == null) {
      return null;
    }

    return parseCommentsCount(countResponse.value);
  });

  return {
    myCommentsCount,
    pending,
    error,
  };
}
