<script setup lang="ts">
  import type { PlayerBastion } from '../../model';

  import { UiModalActions } from '~ui/modal-actions';

  import { useBastionAction } from '../../composables';
  import {
    ACTIVITY_LABELS,
    buildDefenseWall,
    DEFENSE_WALL_LABELS,
    DEFENSE_WALL_MAX_SQUARES,
    getDefenseWallTermsText,
  } from '../../model';

  /**
   * Заказ блоков защитной стены: цена списывается из казны, блоки строятся
   * друг за другом и появляются для плана, когда достроятся.
   */
  const isOpen = defineModel<boolean>('open', { required: true });

  const { bastion } = defineProps<{
    bastion: PlayerBastion;
  }>();

  const emit = defineEmits<{
    updated: [bastion: PlayerBastion];
  }>();

  const { isRunning, run } = useBastionAction();

  const squares = ref(1);

  const termsText = computed(() => getDefenseWallTermsText(squares.value));

  watch(isOpen, (opened) => {
    if (opened) {
      squares.value = 1;
    }
  });

  /** Начинает стройку стены. */
  async function submit(): Promise<void> {
    const updated = await run(
      () => buildDefenseWall(bastion.id, squares.value),
      DEFENSE_WALL_LABELS.buildDone,
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
    :title="DEFENSE_WALL_LABELS.buildTitle"
    :description="DEFENSE_WALL_LABELS.hint"
  >
    <template #body>
      <UFormField
        :label="DEFENSE_WALL_LABELS.squares"
        :hint="termsText"
      >
        <UInputNumber
          id="bastion-defense-wall-squares"
          v-model="squares"
          :min="1"
          :max="DEFENSE_WALL_MAX_SQUARES"
          class="w-full"
        />
      </UFormField>
    </template>

    <template #footer>
      <UiModalActions
        :cancel-label="ACTIVITY_LABELS.cancelAction"
        :submit-label="DEFENSE_WALL_LABELS.build"
        submit-icon="tabler:wall"
        :loading="isRunning"
        :disabled="!squares"
        @cancel="isOpen = false"
        @submit="submit"
      />
    </template>
  </UModal>
</template>
