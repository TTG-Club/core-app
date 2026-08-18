import type { ComputedRef, Ref } from 'vue';

import type { PublicComment } from '../../model';

import {
  COMMENT_REPLIES_LOAD_ERROR_TOAST,
  fetchCommentReplies,
  getCommentErrorMessage,
} from '../../model';

/** Описание возвращаемого значения композабла useMyCommentReplies. */
export interface UseMyCommentRepliesReturn {
  /** Загруженные ответы, от старых к новым */
  replies: Ref<Array<PublicComment>>;

  /** Раскрыта ли ветка */
  isExpanded: Ref<boolean>;

  /** Идёт ли загрузка ветки */
  isLoading: ComputedRef<boolean>;

  /** Свернуть или раскрыть ветку, догрузив её при первом раскрытии */
  toggle: () => Promise<void>;
}

/**
 * Ветка ответов на один свой комментарий в профиле: грузится лениво, при
 * первом раскрытии карточки. В списке таких карточек десяток, и тянуть все
 * ветки заранее означало бы десяток запросов ради текста, который чаще всего
 * не разворачивают — в карточке и так виден последний ответ.
 *
 * Сервис отдаёт только прямых детей, и это ровно то, что нужно: ответы дальше
 * по ветке адресованы уже не автору комментария.
 *
 * @param getCommentId Геттер идентификатора комментария (сохраняет реактивность пропсов).
 */
export function useMyCommentReplies(
  getCommentId: () => string,
): UseMyCommentRepliesReturn {
  const toast = useToast();

  const replies = ref<Array<PublicComment>>([]);
  const isExpanded = ref(false);
  const isLoaded = ref(false);
  const pending = ref(false);

  const isLoading = computed(() => pending.value);

  async function toggle(): Promise<void> {
    if (isExpanded.value) {
      isExpanded.value = false;

      return;
    }

    isExpanded.value = true;

    if (isLoaded.value || pending.value) {
      return;
    }

    pending.value = true;

    try {
      replies.value = await fetchCommentReplies(getCommentId());
      isLoaded.value = true;
    } catch (error: unknown) {
      isExpanded.value = false;

      toast.add({
        title: COMMENT_REPLIES_LOAD_ERROR_TOAST,
        description: getCommentErrorMessage(error),
        color: 'error',
      });
    } finally {
      pending.value = false;
    }
  }

  return {
    replies,
    isExpanded,
    isLoading,
    toggle,
  };
}
