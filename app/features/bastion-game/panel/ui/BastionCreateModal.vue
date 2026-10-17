<script setup lang="ts">
  import type {
    CreatePlayerBastionRequest,
    FacilitySetupDraft,
  } from '../../model';

  import { UiModalActions } from '~ui/modal-actions';

  import { FacilitySetupForm } from '../../facilities';
  import {
    BASTION_FORM_LABELS,
    BASTION_NAME_MAX_LENGTH,
    BASTION_START_LEVEL,
    CHARACTER_LEVEL_MAX,
    CHARACTER_LEVEL_MIN,
    createEmptySetupDraft,
    getSpecialFacilityLimit,
    isBasicChosen,
    toSetupRequest,
  } from '../../model';

  /**
   * Создание своего бастиона: название, персонаж владельца и его стартовые
   * сооружения. Бастион начинает действовать сразу, поэтому без двух базовых
   * сооружений создать его нельзя.
   */
  const isOpen = defineModel<boolean>('open', { required: true });

  const { loading = false } = defineProps<{
    loading?: boolean;
  }>();

  const emit = defineEmits<{
    submit: [request: CreatePlayerBastionRequest];
  }>();

  const name = ref('');
  const characterName = ref('');
  const characterLevel = ref(BASTION_START_LEVEL);
  const draft = ref<FacilitySetupDraft>(createEmptySetupDraft());

  const specialLimit = computed(() =>
    getSpecialFacilityLimit(characterLevel.value),
  );

  const isNameValid = computed(() => {
    const trimmed = name.value.trim();

    return trimmed.length > 0 && trimmed.length <= BASTION_NAME_MAX_LENGTH;
  });

  const isValid = computed(
    () => isNameValid.value && isBasicChosen(draft.value),
  );

  /** Ошибка поля названия: только когда что-то введено, но не подходит. */
  const nameError = computed(() =>
    name.value && !isNameValid.value
      ? BASTION_FORM_LABELS.nameRequired
      : undefined,
  );

  /** Персонаж ниже 5 уровня бастиона по правилам ещё не имеет. */
  const levelHint = computed(() =>
    characterLevel.value < BASTION_START_LEVEL
      ? BASTION_FORM_LABELS.belowStartLevel
      : undefined,
  );

  // При каждом открытии форма пустая.
  watch(isOpen, (opened) => {
    if (!opened) {
      return;
    }

    name.value = '';
    characterName.value = '';
    characterLevel.value = BASTION_START_LEVEL;
    draft.value = createEmptySetupDraft();
  });

  /** Закрывает окно без сохранения. */
  function cancel(): void {
    isOpen.value = false;
  }

  /** Отдаёт бастион родителю. */
  function submit(): void {
    if (!isValid.value) {
      return;
    }

    const { basic, special } = toSetupRequest(draft.value, 0);

    emit('submit', {
      name: name.value.trim(),
      characterName: characterName.value.trim(),
      characterLevel: characterLevel.value,
      basic,
      special,
    });
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="BASTION_FORM_LABELS.createTitle"
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
            id="new-bastion-name"
            v-model="name"
            :maxlength="BASTION_NAME_MAX_LENGTH"
            :placeholder="BASTION_FORM_LABELS.namePlaceholder"
            class="w-full"
          />
        </UFormField>

        <div class="flex flex-col gap-2">
          <div class="flex flex-col">
            <span class="text-sm font-medium text-highlighted">
              {{ BASTION_FORM_LABELS.owner }}
            </span>

            <span class="text-xs text-muted">
              {{ BASTION_FORM_LABELS.ownerHint }}
            </span>
          </div>

          <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <UFormField
              class="sm:col-span-2"
              :label="BASTION_FORM_LABELS.characterName"
            >
              <UInput
                id="new-bastion-character"
                v-model="characterName"
                :placeholder="BASTION_FORM_LABELS.characterNamePlaceholder"
                class="w-full"
              />
            </UFormField>

            <UFormField
              :label="BASTION_FORM_LABELS.characterLevel"
              :hint="levelHint"
            >
              <UInputNumber
                id="new-bastion-level"
                v-model="characterLevel"
                :min="CHARACTER_LEVEL_MIN"
                :max="CHARACTER_LEVEL_MAX"
                class="w-full"
              />
            </UFormField>
          </div>
        </div>

        <USeparator />

        <p class="text-sm text-muted">
          {{ BASTION_FORM_LABELS.facilitiesHint }}
        </p>

        <FacilitySetupForm
          v-model="draft"
          :character-level="characterLevel"
          :limit="specialLimit"
          id-prefix="new-bastion-facility"
        />
      </div>
    </template>

    <template #footer>
      <UiModalActions
        :cancel-label="BASTION_FORM_LABELS.cancel"
        :submit-label="BASTION_FORM_LABELS.create"
        submit-icon="tabler:check"
        :loading
        :disabled="!isValid"
        @cancel="cancel"
        @submit="submit"
      />
    </template>
  </UModal>
</template>
