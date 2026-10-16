<script setup lang="ts">
  import type { BastionActivityOrder, PlayerBastion } from '../../model';

  import { useBastionAction } from '../../composables';
  import { ACTIVITY_LABELS, writeBastionOrderResult } from '../../model';

  /**
   * Итог выполненного приказа в журнале: что получили или узнали. Записывает
   * мастер или тот, кто отдал приказ, — после хода, а не в его окне.
   */
  const { bastion, order } = defineProps<{
    bastion: PlayerBastion;
    order: BastionActivityOrder;
  }>();

  const emit = defineEmits<{
    updated: [bastion: PlayerBastion];
  }>();

  const { isRunning, run } = useBastionAction();

  const isEditing = ref(false);
  const draft = ref('');

  const toggleLabel = computed(() =>
    order.result ? ACTIVITY_LABELS.resultEdit : ACTIVITY_LABELS.resultWrite,
  );

  /** Открывает поле итога с текущим текстом. */
  function edit(): void {
    draft.value = order.result ?? '';
    isEditing.value = true;
  }

  /** Сохраняет итог. */
  async function save(): Promise<void> {
    const updated = await run(
      () => writeBastionOrderResult(bastion.id, order.id, draft.value.trim()),
      ACTIVITY_LABELS.resultSaved,
    );

    if (updated) {
      isEditing.value = false;
      emit('updated', updated);
    }
  }
</script>

<template>
  <div
    v-if="isEditing"
    class="flex flex-wrap items-start gap-2"
  >
    <UTextarea
      :id="`bastion-order-result-${order.id}`"
      v-model="draft"
      :rows="1"
      :maxlength="4000"
      autoresize
      :placeholder="ACTIVITY_LABELS.resultPlaceholder"
      size="sm"
      class="min-w-64 flex-1"
    />

    <UButton
      icon="tabler:check"
      size="sm"
      :loading="isRunning"
      @click.left.exact.prevent="save"
    >
      {{ ACTIVITY_LABELS.resultSave }}
    </UButton>

    <UButton
      size="sm"
      color="neutral"
      variant="ghost"
      @click.left.exact.prevent="isEditing = false"
    >
      {{ ACTIVITY_LABELS.cancelAction }}
    </UButton>
  </div>

  <UButton
    v-else
    icon="tabler:pencil"
    size="xs"
    color="neutral"
    variant="ghost"
    class="self-start"
    @click.left.exact.prevent="edit"
  >
    {{ toggleLabel }}
  </UButton>
</template>
