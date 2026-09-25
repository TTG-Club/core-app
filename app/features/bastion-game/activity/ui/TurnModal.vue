<script setup lang="ts">
  import type { BastionActivity, PlayerBastion } from '../../model';

  import { fillTemplate } from '~bastions/model';
  import { UiModalActions } from '~ui/modal-actions';

  import { useBastionAction } from '../../composables';
  import {
    ACTIVITY_LABELS,
    getOrderTitle,
    performBastionTurn,
  } from '../../model';

  /**
   * Ход бастиона мастером: итоги приказов, которые завершатся, и событие
   * бастиона, если его в этот ход обслуживали.
   */
  const isOpen = defineModel<boolean>('open', { required: true });

  const { bastion, activity } = defineProps<{
    bastion: PlayerBastion;
    activity: BastionActivity | undefined;
  }>();

  const emit = defineEmits<{
    updated: [bastion: PlayerBastion];
  }>();

  const { isRunning, run } = useBastionAction();

  const results = ref<Record<string, string>>({});
  const event = ref('');

  const nextTurn = computed(() => bastion.turn + 1);

  const title = computed(() =>
    fillTemplate(ACTIVITY_LABELS.turnTitle, { turn: nextTurn.value }),
  );

  /** Приказы, которые завершатся в этот ход. */
  const completing = computed(() =>
    (activity?.orders ?? []).filter(
      (order) =>
        order.status === 'ACTIVE' && order.completesOnTurn <= nextTurn.value,
    ),
  );

  /** Ход — обслуживание: приказов не отдали или отдали «Обслуживать». */
  const isMaintain = computed(() => {
    const given = (activity?.orders ?? []).filter(
      (order) =>
        order.status !== 'CANCELLED' && order.givenOnTurn === bastion.turn,
    );

    return (
      given.length === 0
      || given.some((order) => order.order.value === 'MAINTAIN')
    );
  });

  watch(isOpen, (opened) => {
    if (opened) {
      results.value = {};
      event.value = '';
    }
  });

  /**
   * Запоминает итог приказа.
   *
   * @param orderId Приказ.
   * @param value Итог.
   */
  function setResult(orderId: string, value: string): void {
    results.value = { ...results.value, [orderId]: value };
  }

  /** Делает ход. */
  async function submit(): Promise<void> {
    const updated = await run(
      () =>
        performBastionTurn(bastion.id, {
          event: event.value.trim() || undefined,
          results: results.value,
        }),
      ACTIVITY_LABELS.turnDone,
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
    :title
    :description="ACTIVITY_LABELS.turnHint"
    :ui="{ content: 'sm:max-w-2xl' }"
  >
    <template #body>
      <div class="flex flex-col gap-5">
        <section class="flex flex-col gap-2">
          <h3 class="text-sm font-semibold text-highlighted">
            {{ ACTIVITY_LABELS.turnResults }}
          </h3>

          <p
            v-if="!completing.length"
            class="text-sm text-muted"
          >
            {{ ACTIVITY_LABELS.turnNoCompleting }}
          </p>

          <UFormField
            v-for="order in completing"
            :key="order.id"
            :label="getOrderTitle(order)"
            :help="order.optionName ?? undefined"
          >
            <UTextarea
              :id="`bastion-turn-result-${order.id}`"
              :model-value="results[order.id] ?? ''"
              :rows="1"
              autoresize
              :placeholder="ACTIVITY_LABELS.turnResultPlaceholder"
              class="w-full"
              @update:model-value="setResult(order.id, String($event))"
            />
          </UFormField>
        </section>

        <UFormField
          v-if="isMaintain"
          :label="ACTIVITY_LABELS.turnEvent"
          :help="ACTIVITY_LABELS.turnEventHint"
        >
          <UTextarea
            id="bastion-turn-event"
            v-model="event"
            :rows="2"
            autoresize
            class="w-full"
          />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <UiModalActions
        :cancel-label="ACTIVITY_LABELS.cancelAction"
        :submit-label="ACTIVITY_LABELS.turn"
        submit-icon="tabler:player-track-next"
        :loading="isRunning"
        @cancel="isOpen = false"
        @submit="submit"
      />
    </template>
  </UModal>
</template>
