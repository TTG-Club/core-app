<script setup lang="ts">
  import type { PlayerBastion } from '../../model';

  import { UiModalActions } from '~ui/modal-actions';

  import { useBastionAction } from '../../composables';
  import { ACTIVITY_LABELS, adjustBastionTreasury } from '../../model';

  /** Казна мастером: плюс — пополнение, минус — списание. */
  const isOpen = defineModel<boolean>('open', { required: true });

  const { bastion } = defineProps<{
    bastion: PlayerBastion;
  }>();

  const emit = defineEmits<{
    updated: [bastion: PlayerBastion];
  }>();

  const { isRunning, run } = useBastionAction();

  const amount = ref<number | null>(null);
  const note = ref('');

  watch(isOpen, (opened) => {
    if (opened) {
      amount.value = null;
      note.value = '';
    }
  });

  /** Проводит движение казны. */
  async function submit(): Promise<void> {
    const value = amount.value;

    if (!value) {
      return;
    }

    const updated = await run(
      () =>
        adjustBastionTreasury(
          bastion.id,
          value,
          note.value.trim() || undefined,
        ),
      ACTIVITY_LABELS.treasuryDone,
    );

    if (updated) {
      emit('updated', updated);
      isOpen.value = false;
    }
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="ACTIVITY_LABELS.treasuryTitle"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <UFormField
          :label="ACTIVITY_LABELS.treasuryAmount"
          :help="ACTIVITY_LABELS.treasuryAmountHint"
        >
          <UInputNumber
            id="bastion-treasury-amount"
            v-model="amount"
            class="w-full"
          />
        </UFormField>

        <UFormField :label="ACTIVITY_LABELS.treasuryNote">
          <UInput
            id="bastion-treasury-note"
            v-model="note"
            :maxlength="500"
            class="w-full"
          />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <UiModalActions
        :cancel-label="ACTIVITY_LABELS.cancelAction"
        :submit-label="ACTIVITY_LABELS.confirm"
        submit-icon="tabler:coins"
        :loading="isRunning"
        :disabled="!amount"
        @cancel="isOpen = false"
        @submit="submit"
      />
    </template>
  </UModal>
</template>
