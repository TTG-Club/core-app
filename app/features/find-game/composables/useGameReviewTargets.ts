import type { MaybeRefOrGetter } from 'vue';

import type { ReviewTarget } from '../model';

import { fetchReviewTargets } from '../model';

/**
 * Кого пользователь вправе оценить в игре, со своими оценками.
 *
 * Отказ сервиса читается пустым списком: кнопка оценки просто не
 * показывается, а не роняет страницу игры.
 *
 * @param gameId Игра; `null` — оценивать негде (гость или игра не загружена).
 */
export function useGameReviewTargets(gameId: MaybeRefOrGetter<string | null>) {
  const currentGameId = computed(() => toValue(gameId));

  const { data: targets, refresh } = useAsyncData(
    () => `find-game-review-targets-${currentGameId.value ?? 'none'}`,
    async () => {
      const id = currentGameId.value;

      if (!id) {
        return [];
      }

      try {
        return await fetchReviewTargets(id);
      } catch {
        return [];
      }
    },
    {
      watch: [currentGameId],
      server: false,
      deep: false,
      default: (): Array<ReviewTarget> => [],
    },
  );

  const hasTargets = computed(() => targets.value.length > 0);

  /** Мастер оценивает игроков, игрок — мастера. */
  const isMasterReview = computed(() =>
    targets.value.some((target) => target.kind === 'MASTER_REVIEW'),
  );

  /** Остались ли ещё не оценённые: тогда кнопка зовёт, а не просто стоит. */
  const hasUnreviewed = computed(() =>
    targets.value.some((target) => !target.review),
  );

  return {
    targets,
    hasTargets,
    isMasterReview,
    hasUnreviewed,
    refresh,
  };
}
