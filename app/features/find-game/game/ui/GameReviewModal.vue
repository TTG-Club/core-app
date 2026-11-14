<script setup lang="ts">
  import type { Game, ReviewTarget } from '../../model';

  import { UiResult } from '~ui/result';
  import { UserAvatar } from '~ui/user-avatar';

  import { useFindGameToast, useParticipantNames } from '../../composables';
  import {
    CANCEL_LABEL,
    PENDING_REVIEWS_DATA_KEY,
    REVIEW_COMMENT_LABEL,
    REVIEW_COMMENT_MAX_LENGTH,
    REVIEW_COMMENT_PLACEHOLDER,
    REVIEW_DOWN_LABEL,
    REVIEW_EMPTY_PARTICIPANTS,
    REVIEW_HIDDEN_HINT,
    REVIEW_LOCKED_LABEL,
    REVIEW_RULES_HINT,
    REVIEW_SAVED_TOAST,
    REVIEW_SUBMIT_LABEL,
    REVIEW_TITLE,
    REVIEW_UP_LABEL,
    submitGameReview,
  } from '../../model';
  import { ParticipantName } from '../../ui';

  /**
   * Взаимные оценки за игру.
   *
   * Игрок отвечает про мастера, мастер — про каждого сыгравшего игрока.
   * Оценка бинарная: «сыграл бы снова» или нет, и ставится одна за всю игру.
   * Чужой вердикт до ответа второй стороны не показывается — увидевший
   * первым отвечал бы тем же.
   */
  const isOpen = defineModel<boolean>('open', { required: true });

  const { game, targets } = defineProps<{
    game: Game;
    /** Кого пользователь вправе оценить, со своими оценками. */
    targets: Array<ReviewTarget>;
  }>();

  const emit = defineEmits<{
    saved: [];
  }>();

  const { showError, showSuccess } = useFindGameToast();
  const { getParticipantAvatarName, resolveNames } = useParticipantNames();

  /** Свои вердикты по оцениваемым, пока их правят в форме. */
  const verdicts = ref<Record<string, boolean>>({});
  const comments = ref<Record<string, string>>({});
  const savedTargets = ref<Array<string>>([]);
  const busyTargetId = ref<string | null>(null);

  const targetIds = computed(() => targets.map((target) => target.targetId));

  /** Раскрытые оценки: их уже прочла вторая сторона, и поправить их нельзя. */
  const lockedTargetIds = computed(() =>
    targets
      .filter((target) => !target.editable)
      .map((target) => target.targetId),
  );

  /**
   * Заполняет форму уже поставленными оценками: повторная оценка правит свою
   * же, и форма должна открываться с ней, а не пустой.
   */
  function fillFromTargets(): void {
    const reviewed = targets.flatMap((target) =>
      target.review ? [target.review] : [],
    );

    verdicts.value = Object.fromEntries(
      reviewed.map((review) => [review.targetId, review.recommended]),
    );

    comments.value = Object.fromEntries(
      reviewed.map((review) => [review.targetId, review.comment ?? '']),
    );

    savedTargets.value = reviewed.map((review) => review.targetId);
  }

  /**
   * Сохраняет оценку одного участника.
   * @param targetId Кого оценивают.
   */
  async function save(targetId: string): Promise<void> {
    const recommended = verdicts.value[targetId];

    if (recommended === undefined) {
      return;
    }

    busyTargetId.value = targetId;

    try {
      const comment = (comments.value[targetId] ?? '').trim();

      await submitGameReview(game.id, {
        targetId,
        recommended,
        ...(comment ? { comment } : {}),
      });

      if (!savedTargets.value.includes(targetId)) {
        savedTargets.value = [...savedTargets.value, targetId];
      }

      showSuccess(REVIEW_SAVED_TOAST);
      emit('saved');
      await refreshNuxtData(PENDING_REVIEWS_DATA_KEY);
    } catch (error) {
      showError(error);
    } finally {
      busyTargetId.value = null;
    }
  }

  /**
   * Цвет кнопки вердикта: выбранная сторона загорается, вторая остаётся
   * нейтральной. Функции, а не `computed`: пара кнопок своя у каждого
   * участника игры.
   *
   * @param targetId Кого оценивают.
   * @param recommended Кнопка «сыграл бы снова» или «не сыграл бы».
   */
  function verdictButtonColor(targetId: string, recommended: boolean) {
    if (verdicts.value[targetId] !== recommended) {
      return 'neutral';
    }

    return recommended ? 'success' : 'error';
  }

  /**
   * Заливка кнопки вердикта.
   * @param targetId Кого оценивают.
   * @param recommended Кнопка «сыграл бы снова» или «не сыграл бы».
   */
  function verdictButtonVariant(targetId: string, recommended: boolean) {
    return verdicts.value[targetId] === recommended ? 'solid' : 'subtle';
  }

  /**
   * Ставит вердикт в форме; повторное нажатие по выбранному ничего не меняет.
   * @param targetId Кого оценивают.
   * @param recommended Сыграл бы снова.
   */
  function setVerdict(targetId: string, recommended: boolean): void {
    verdicts.value = { ...verdicts.value, [targetId]: recommended };
  }

  // Форма заполняется при открытии, а не на каждое обновление списка: после
  // сохранения список перезагружается, и правка соседней карточки не должна
  // сбрасываться.
  watch(
    isOpen,
    (opened) => {
      if (!opened) {
        return;
      }

      fillFromTargets();
      resolveNames(targetIds.value);
    },
    { immediate: true },
  );
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="REVIEW_TITLE"
    :description="game.title"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <p class="text-sm text-muted">{{ REVIEW_RULES_HINT }}</p>

        <UiResult
          v-if="!targetIds.length"
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
              <span class="flex min-w-0 items-center gap-2">
                <UserAvatar
                  :user-id="targetId"
                  :name="getParticipantAvatarName(targetId)"
                  size="2xs"
                  class="shrink-0"
                />

                <span class="font-medium text-highlighted">
                  <ParticipantName :user-id="targetId" />
                </span>
              </span>

              <UBadge
                v-if="lockedTargetIds.includes(targetId)"
                color="neutral"
                variant="subtle"
                size="sm"
                icon="tabler:lock"
                :label="REVIEW_LOCKED_LABEL"
              />

              <UBadge
                v-else-if="savedTargets.includes(targetId)"
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
                :color="verdictButtonColor(targetId, true)"
                :variant="verdictButtonVariant(targetId, true)"
                :label="REVIEW_UP_LABEL"
                :disabled="lockedTargetIds.includes(targetId)"
                @click.left.exact.prevent="setVerdict(targetId, true)"
              />

              <UButton
                size="sm"
                icon="tabler:thumb-down"
                :color="verdictButtonColor(targetId, false)"
                :variant="verdictButtonVariant(targetId, false)"
                :label="REVIEW_DOWN_LABEL"
                :disabled="lockedTargetIds.includes(targetId)"
                @click.left.exact.prevent="setVerdict(targetId, false)"
              />
            </div>

            <UFormField :label="REVIEW_COMMENT_LABEL">
              <UTextarea
                v-model="comments[targetId]"
                :rows="3"
                :maxlength="REVIEW_COMMENT_MAX_LENGTH"
                :placeholder="REVIEW_COMMENT_PLACEHOLDER"
                :disabled="lockedTargetIds.includes(targetId)"
                class="w-full"
              />
            </UFormField>

            <UButton
              v-if="!lockedTargetIds.includes(targetId)"
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
