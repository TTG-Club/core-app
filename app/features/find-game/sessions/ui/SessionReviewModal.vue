<script setup lang="ts">
  import type {
    Game,
    GameSession,
    GameViewerAbilities,
    SessionReview,
  } from '../../model';

  import { UiResult } from '~ui/result';

  import { useParticipantNames } from '../../composables';
  import {
    CANCEL_LABEL,
    fetchSessionReviews,
    FIND_GAME_UNKNOWN_ERROR_MESSAGE,
    getFindGameErrorMessage,
    REVIEW_COMMENT_LABEL,
    REVIEW_COMMENT_MAX_LENGTH,
    REVIEW_COMMENT_PLACEHOLDER,
    REVIEW_DOWN_LABEL,
    REVIEW_EMPTY_PARTICIPANTS,
    REVIEW_HIDDEN_HINT,
    REVIEW_SAVED_TOAST,
    REVIEW_SUBMIT_LABEL,
    REVIEW_TITLE,
    REVIEW_UP_LABEL,
    REVIEW_WINDOW_HINT,
    submitSessionReview,
  } from '../../model';

  /**
   * Взаимные оценки за встречу.
   *
   * Игрок отвечает про мастера, мастер — про каждого игрока. Оценка бинарная:
   * «сыграл бы снова» или нет. Чужой вердикт до ответа второй стороны не
   * показывается — увидевший первым отвечал бы тем же.
   */
  const isOpen = defineModel<boolean>('open', { required: true });

  const { game, session, abilities } = defineProps<{
    game: Game;
    /** Встреча, которую оценивают; `null` — окно закрыто. */
    session: GameSession | null;
    abilities: GameViewerAbilities;
  }>();

  const toast = useToast();
  const { user } = useUser();
  const { getParticipantName, resolveNames } = useParticipantNames();

  const currentUserId = computed(() => user.value?.id ?? null);

  /** Свои вердикты по оцениваемым, пока их правят в форме. */
  const verdicts = ref<Record<string, boolean>>({});
  const comments = ref<Record<string, string>>({});
  const savedTargets = ref<Array<string>>([]);
  const busyTargetId = ref<string | null>(null);
  const loadError = ref<unknown>(null);
  const isLoading = ref(false);

  /**
   * Кого оценивает пользователь: мастер — каждого участника встречи, игрок —
   * мастера игры.
   */
  const targetIds = computed(() => {
    if (!session) {
      return [];
    }

    if (abilities.isMaster) {
      return session.registeredPlayerIds.filter(
        (playerId) => playerId !== currentUserId.value,
      );
    }

    return game.masterId === currentUserId.value ? [] : [game.masterId];
  });

  /**
   * Загружает уже поставленные оценки: повторная оценка правит свою же, и
   * форма должна открываться с ней, а не пустой.
   */
  async function loadReviews(): Promise<void> {
    if (!session) {
      return;
    }

    isLoading.value = true;
    loadError.value = null;

    try {
      const reviews = await fetchSessionReviews(game.id, session.id);

      const own = reviews.filter(
        (review: SessionReview) => review.authorId === currentUserId.value,
      );

      verdicts.value = Object.fromEntries(
        own.map((review) => [review.targetId, review.recommended]),
      );

      comments.value = Object.fromEntries(
        own.map((review) => [review.targetId, review.comment ?? '']),
      );

      savedTargets.value = own.map((review) => review.targetId);
    } catch (error) {
      loadError.value = error;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Сохраняет оценку одного участника.
   * @param targetId Кого оценивают.
   */
  async function save(targetId: string): Promise<void> {
    const recommended = verdicts.value[targetId];

    if (!session || recommended === undefined) {
      return;
    }

    busyTargetId.value = targetId;

    try {
      const comment = (comments.value[targetId] ?? '').trim();

      await submitSessionReview(game.id, session.id, {
        targetId,
        recommended,
        ...(comment ? { comment } : {}),
      });

      if (!savedTargets.value.includes(targetId)) {
        savedTargets.value = [...savedTargets.value, targetId];
      }

      toast.add({
        title: REVIEW_SAVED_TOAST,
        color: 'success',
        icon: 'tabler:check',
      });
    } catch (error) {
      toast.add({
        title: FIND_GAME_UNKNOWN_ERROR_MESSAGE,
        description: getFindGameErrorMessage(error),
        color: 'error',
        icon: 'tabler:alert-triangle',
      });
    } finally {
      busyTargetId.value = null;
    }
  }

  /**
   * Ставит вердикт в форме; повторное нажатие по выбранному ничего не меняет.
   * @param targetId Кого оценивают.
   * @param recommended Сыграл бы снова.
   */
  function setVerdict(targetId: string, recommended: boolean): void {
    verdicts.value = { ...verdicts.value, [targetId]: recommended };
  }

  watch(
    [isOpen, () => session?.id],
    ([opened]) => {
      if (!opened) {
        return;
      }

      verdicts.value = {};
      comments.value = {};
      savedTargets.value = [];
      loadReviews();
      resolveNames(targetIds.value);
    },
    { immediate: true },
  );
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="REVIEW_TITLE"
    :description="session?.title"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <p class="text-sm text-muted">{{ REVIEW_WINDOW_HINT }}</p>

        <div
          v-if="isLoading"
          class="flex flex-col gap-2"
        >
          <USkeleton
            v-for="index in 2"
            :key="index"
            class="h-24 w-full rounded-lg"
          />
        </div>

        <UiResult
          v-else-if="loadError"
          status="error"
          :title="FIND_GAME_UNKNOWN_ERROR_MESSAGE"
          :sub-title="getFindGameErrorMessage(loadError)"
        />

        <UiResult
          v-else-if="!targetIds.length"
          status="info"
          :title="REVIEW_EMPTY_PARTICIPANTS"
        />

        <template v-else>
          <div
            v-for="targetId in targetIds"
            :key="targetId"
            class="flex flex-col gap-2 rounded-lg border border-default p-3"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="font-medium text-highlighted">
                {{ getParticipantName(targetId) }}
              </span>

              <UBadge
                v-if="savedTargets.includes(targetId)"
                color="success"
                variant="subtle"
                size="sm"
                icon="tabler:check"
                :label="REVIEW_SAVED_TOAST"
              />
            </div>

            <div class="flex flex-wrap gap-2">
              <UButton
                size="sm"
                icon="tabler:thumb-up"
                :color="verdicts[targetId] === true ? 'success' : 'neutral'"
                :variant="verdicts[targetId] === true ? 'solid' : 'subtle'"
                :label="REVIEW_UP_LABEL"
                @click.left.exact.prevent="setVerdict(targetId, true)"
              />

              <UButton
                size="sm"
                icon="tabler:thumb-down"
                :color="verdicts[targetId] === false ? 'error' : 'neutral'"
                :variant="verdicts[targetId] === false ? 'solid' : 'subtle'"
                :label="REVIEW_DOWN_LABEL"
                @click.left.exact.prevent="setVerdict(targetId, false)"
              />
            </div>

            <UFormField :label="REVIEW_COMMENT_LABEL">
              <UTextarea
                v-model="comments[targetId]"
                :rows="3"
                :maxlength="REVIEW_COMMENT_MAX_LENGTH"
                :placeholder="REVIEW_COMMENT_PLACEHOLDER"
                class="w-full"
              />
            </UFormField>

            <UButton
              size="sm"
              class="self-start"
              icon="tabler:device-floppy"
              :loading="busyTargetId === targetId"
              :disabled="verdicts[targetId] === undefined"
              :label="REVIEW_SUBMIT_LABEL"
              @click.left.exact.prevent="save(targetId)"
            />
          </div>

          <p class="text-sm text-muted">{{ REVIEW_HIDDEN_HINT }}</p>
        </template>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end">
        <UButton
          variant="ghost"
          color="neutral"
          :label="CANCEL_LABEL"
          @click.left.exact.prevent="isOpen = false"
        />
      </div>
    </template>
  </UModal>
</template>
