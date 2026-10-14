<script setup lang="ts">
  import type { PlayerBastion } from '../../model';

  import { UiModalActions } from '~ui/modal-actions';

  import {
    BASTION_JOIN_LABELS,
    MY_BASTIONS_ROUTE,
    PLAYER_BASTION_STATUS_LABELS,
  } from '../../model';

  /**
   * Выбор своего бастиона, который добавляется в игру. Показываются только
   * свободные бастионы: вне игры и не в архиве.
   */
  const isOpen = defineModel<boolean>('open', { required: true });

  const {
    bastions,
    pending = false,
    loading = false,
    errorMessage = undefined,
  } = defineProps<{
    bastions: ReadonlyArray<PlayerBastion>;
    /** Список ещё грузится. */
    pending?: boolean;
    /** Идёт добавление. */
    loading?: boolean;
    /** Список не загрузился. */
    errorMessage?: string;
  }>();

  const emit = defineEmits<{
    submit: [bastionId: string];
  }>();

  const selectedId = ref<string>();

  const items = computed(() =>
    bastions.map((bastion) => ({
      value: bastion.id,
      label: bastion.name,
      description: PLAYER_BASTION_STATUS_LABELS[bastion.status],
    })),
  );

  const isEmpty = computed(() => !pending && !errorMessage && !bastions.length);

  // При открытии выбран первый свободный бастион, а если список пришёл позже
  // — первый из пришедших.
  watch(
    [isOpen, () => bastions],
    ([opened, current]) => {
      const isKnown = current.some(
        (bastion) => bastion.id === selectedId.value,
      );

      if (opened && !isKnown) {
        selectedId.value = current[0]?.id;
      }
    },
    { immediate: true },
  );

  /** Закрывает окно без добавления. */
  function cancel(): void {
    isOpen.value = false;
  }

  /** Отдаёт выбранный бастион родителю. */
  function submit(): void {
    if (selectedId.value) {
      emit('submit', selectedId.value);
    }
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="BASTION_JOIN_LABELS.title"
    :description="BASTION_JOIN_LABELS.description"
  >
    <template #body>
      <div class="flex flex-col gap-3">
        <USkeleton
          v-if="pending"
          class="h-24"
        />

        <p
          v-else-if="errorMessage"
          class="text-sm text-error"
        >
          {{ errorMessage }}
        </p>

        <div
          v-else-if="isEmpty"
          class="flex flex-col items-start gap-2"
        >
          <p class="text-sm text-muted">
            {{ BASTION_JOIN_LABELS.empty }}
          </p>

          <UButton
            :to="MY_BASTIONS_ROUTE"
            icon="tabler:building-castle"
            variant="subtle"
          >
            {{ BASTION_JOIN_LABELS.createLink }}
          </UButton>
        </div>

        <URadioGroup
          v-else
          v-model="selectedId"
          :items
        />
      </div>
    </template>

    <template #footer>
      <UiModalActions
        :cancel-label="BASTION_JOIN_LABELS.cancel"
        :submit-label="BASTION_JOIN_LABELS.submit"
        submit-icon="tabler:plus"
        :loading
        :disabled="!selectedId"
        @cancel="cancel"
        @submit="submit"
      />
    </template>
  </UModal>
</template>
