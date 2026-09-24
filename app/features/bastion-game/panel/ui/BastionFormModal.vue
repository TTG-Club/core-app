<script setup lang="ts">
  import type {
    BastionMemberDraft,
    GamePlayer,
    PlayerBastion,
    PlayerBastionMemberRequest,
  } from '../../model';

  import { ParticipantName } from '~find-game/ui';
  import { UiModalActions } from '~ui/modal-actions';

  import {
    BASTION_FORM_LABELS,
    BASTION_NAME_MAX_LENGTH,
    BASTION_START_LEVEL,
    CHARACTER_LEVEL_MAX,
    CHARACTER_LEVEL_MIN,
    createMemberDrafts,
    toMemberRequests,
  } from '../../model';

  /**
   * Создание и правка бастиона мастером: название и доступ игрокам. Доступ
   * даётся только игрокам игры с одобренной заявкой, у каждого — свой персонаж
   * и уровень: по уровню считается лимит специализированных сооружений.
   */
  const isOpen = defineModel<boolean>('open', { required: true });

  const {
    players,
    bastion = undefined,
    loading = false,
  } = defineProps<{
    players: ReadonlyArray<GamePlayer>;
    /** Редактируемый бастион; нет — форма создания. */
    bastion?: PlayerBastion;
    loading?: boolean;
  }>();

  const emit = defineEmits<{
    submit: [name: string, members: Array<PlayerBastionMemberRequest>];
  }>();

  const name = ref('');
  const drafts = ref<Array<BastionMemberDraft>>([]);

  const title = computed(() =>
    bastion ? BASTION_FORM_LABELS.editTitle : BASTION_FORM_LABELS.createTitle,
  );

  const submitLabel = computed(() =>
    bastion ? BASTION_FORM_LABELS.save : BASTION_FORM_LABELS.create,
  );

  const isValid = computed(() => {
    const trimmed = name.value.trim();

    return trimmed.length > 0 && trimmed.length <= BASTION_NAME_MAX_LENGTH;
  });

  /** Ошибка поля названия: только когда что-то введено, но не подходит. */
  const nameError = computed(() =>
    name.value && !isValid.value ? BASTION_FORM_LABELS.nameRequired : undefined,
  );

  // Окно живёт вместе со страницей: при каждом открытии форма заполняется
  // заново — названием и составом редактируемого бастиона или пустой.
  watch(isOpen, (opened) => {
    if (!opened) {
      return;
    }

    name.value = bastion?.name ?? '';
    drafts.value = createMemberDrafts(players, bastion);
  });

  /**
   * Подсказка к уровню. Персонаж ниже 5 уровня бастиона по правилам ещё не
   * имеет — мастер может дать доступ заранее, форма только предупреждает.
   *
   * @param draft Строка формы доступа.
   * @returns Текст предупреждения или undefined.
   */
  function getLevelHint(draft: BastionMemberDraft): string | undefined {
    return draft.selected && draft.characterLevel < BASTION_START_LEVEL
      ? BASTION_FORM_LABELS.belowStartLevel
      : undefined;
  }

  /** Закрывает окно без сохранения. */
  function cancel(): void {
    isOpen.value = false;
  }

  /** Отдаёт название и отмеченных игроков родителю. */
  function submit(): void {
    if (!isValid.value) {
      return;
    }

    emit('submit', name.value.trim(), toMemberRequests(drafts.value));
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title
    :ui="{ content: 'sm:max-w-2xl' }"
  >
    <template #body>
      <div class="flex flex-col gap-5">
        <UFormField
          :label="BASTION_FORM_LABELS.name"
          :error="nameError"
          required
        >
          <UInput
            id="player-bastion-name"
            v-model="name"
            :maxlength="BASTION_NAME_MAX_LENGTH"
            :placeholder="BASTION_FORM_LABELS.namePlaceholder"
            class="w-full"
          />
        </UFormField>

        <div class="flex flex-col gap-2">
          <div class="flex flex-col">
            <span class="text-sm font-medium text-highlighted">
              {{ BASTION_FORM_LABELS.players }}
            </span>

            <span class="text-xs text-muted">
              {{ BASTION_FORM_LABELS.playersHint }}
            </span>
          </div>

          <p
            v-if="!drafts.length"
            class="text-sm text-muted"
          >
            {{ BASTION_FORM_LABELS.noPlayers }}
          </p>

          <div
            v-for="draft in drafts"
            :key="draft.userId"
            class="grid grid-cols-1 items-end gap-3 rounded-lg bg-elevated/40 p-3 sm:grid-cols-12"
          >
            <UCheckbox
              :id="`player-bastion-member-${draft.userId}`"
              v-model="draft.selected"
              class="sm:col-span-4 sm:self-center"
            >
              <template #label>
                <ParticipantName :user-id="draft.userId" />
              </template>
            </UCheckbox>

            <UFormField
              class="sm:col-span-5"
              :label="BASTION_FORM_LABELS.characterName"
            >
              <UInput
                :id="`player-bastion-character-${draft.userId}`"
                v-model="draft.characterName"
                :disabled="!draft.selected"
                :placeholder="BASTION_FORM_LABELS.characterNamePlaceholder"
                class="w-full"
              />
            </UFormField>

            <UFormField
              class="sm:col-span-3"
              :label="BASTION_FORM_LABELS.characterLevel"
              :hint="getLevelHint(draft)"
            >
              <UInputNumber
                :id="`player-bastion-level-${draft.userId}`"
                v-model="draft.characterLevel"
                :disabled="!draft.selected"
                :min="CHARACTER_LEVEL_MIN"
                :max="CHARACTER_LEVEL_MAX"
                class="w-full"
              />
            </UFormField>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <UiModalActions
        :cancel-label="BASTION_FORM_LABELS.cancel"
        :submit-label="submitLabel"
        submit-icon="tabler:check"
        :loading
        :disabled="!isValid"
        @cancel="cancel"
        @submit="submit"
      />
    </template>
  </UModal>
</template>
