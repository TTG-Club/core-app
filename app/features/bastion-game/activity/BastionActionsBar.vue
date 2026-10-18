<script setup lang="ts">
  import type { BastionActivity, PlayerBastion } from '../model';

  import { fillTemplate } from '~bastions/model';
  import { ConfirmDialog } from '~initiative/ui-kit';

  import { useBastionAction } from '../composables';
  import {
    ACTIVITY_LABELS,
    getOrderTitle,
    giveBastionOrder,
    performBastionTurn,
  } from '../model';
  import { TreasuryModal } from './ui';

  /**
   * Действия запущенного бастиона: «Обслуживать» — мастеру и игрокам с
   * доступом, ход и казна — только мастеру. «Обслуживать» отменяет приказы,
   * которые сооружения ещё выполняют, — перед этим спрашивает подтверждение.
   */
  const { bastion, activity } = defineProps<{
    bastion: PlayerBastion;
    activity: BastionActivity | undefined;
  }>();

  const emit = defineEmits<{
    updated: [bastion: PlayerBastion];
  }>();

  const { isRunning, run } = useBastionAction();

  const isTurnConfirmOpen = ref(false);
  const isTreasuryOpen = ref(false);
  const isMaintainConfirmOpen = ref(false);

  const isActive = computed(() => bastion.status === 'ACTIVE');

  const canMaintain = computed(
    () =>
      isActive.value
      && (bastion.canManage
        || bastion.members.some((member) => member.canGiveOrders)),
  );

  /** Приказы сооружений, которые ещё выполняются: «Обслуживать» их отменит. */
  const activeOrders = computed(
    () =>
      activity?.orders.filter(
        (order) =>
          order.status === 'ACTIVE' && order.order.value !== 'MAINTAIN',
      ) ?? [],
  );

  const nextTurn = computed(() => bastion.turn + 1);

  const turnTitle = computed(() =>
    fillTemplate(ACTIVITY_LABELS.turnTitle, { turn: nextTurn.value }),
  );

  /** Что произойдёт за ход: 7 дней и приказы, которые завершатся. */
  const turnDescription = computed(() => {
    const completing = (activity?.orders ?? []).filter(
      (order) =>
        order.status === 'ACTIVE' && order.completesOnTurn <= nextTurn.value,
    );

    return completing.length
      ? `${ACTIVITY_LABELS.turnHint} ${fillTemplate(
          ACTIVITY_LABELS.turnCompleting,
          { orders: completing.map(getOrderTitle).join(', ') },
        )}`
      : ACTIVITY_LABELS.turnHint;
  });

  /** Делает ход бастиона: проходят 7 дней. */
  async function performTurn(): Promise<void> {
    const updated = await run(
      () => performBastionTurn(bastion.id),
      ACTIVITY_LABELS.turnDone,
    );

    isTurnConfirmOpen.value = false;

    if (updated) {
      emit('updated', updated);
    }
  }

  const maintainCancelDescription = computed(() =>
    fillTemplate(ACTIVITY_LABELS.maintainCancelDescription, {
      orders: activeOrders.value.map(getOrderTitle).join(', '),
    }),
  );

  /**
   * Отдаёт «Обслуживать» всему бастиону.
   *
   * @param cancelActive Отменить приказы, которые ещё выполняются.
   */
  async function giveMaintain(cancelActive: boolean): Promise<void> {
    const updated = await run(
      () =>
        giveBastionOrder(bastion.id, {
          order: 'MAINTAIN',
          ...(cancelActive ? { cancelActive } : {}),
        }),
      ACTIVITY_LABELS.orderGiven,
    );

    isMaintainConfirmOpen.value = false;

    if (updated) {
      emit('updated', updated);
    }
  }

  /** «Обслуживать»: если сооружения заняты, сначала спрашивает подтверждение. */
  function maintain(): void {
    if (activeOrders.value.length) {
      isMaintainConfirmOpen.value = true;

      return;
    }

    void giveMaintain(false);
  }
</script>

<template>
  <div
    v-if="isActive"
    class="flex flex-wrap items-center gap-2"
  >
    <UTooltip
      v-if="canMaintain"
      :text="ACTIVITY_LABELS.maintainHint"
    >
      <UButton
        icon="tabler:tool"
        color="neutral"
        variant="subtle"
        :loading="isRunning"
        @click.left.exact.prevent="maintain"
      >
        {{ ACTIVITY_LABELS.maintainOrder }}
      </UButton>
    </UTooltip>

    <ConfirmDialog
      v-if="canMaintain"
      v-model:open="isMaintainConfirmOpen"
      :title="ACTIVITY_LABELS.maintainCancelTitle"
      :description="maintainCancelDescription"
      :confirm-label="ACTIVITY_LABELS.cancel"
      :cancel-label="ACTIVITY_LABELS.maintainCancelNo"
      confirm-color="warning"
      confirm-icon="tabler:tool"
      :loading="isRunning"
      @confirm="giveMaintain(true)"
    />

    <template v-if="bastion.canManage">
      <UButton
        icon="tabler:coins"
        color="neutral"
        variant="subtle"
        @click.left.exact.prevent="isTreasuryOpen = true"
      >
        {{ ACTIVITY_LABELS.treasury }}
      </UButton>

      <UButton
        icon="tabler:player-track-next"
        @click.left.exact.prevent="isTurnConfirmOpen = true"
      >
        {{ ACTIVITY_LABELS.turn }}
      </UButton>

      <ConfirmDialog
        v-model:open="isTurnConfirmOpen"
        :title="turnTitle"
        :description="turnDescription"
        :confirm-label="ACTIVITY_LABELS.turn"
        :cancel-label="ACTIVITY_LABELS.cancelAction"
        confirm-icon="tabler:player-track-next"
        :loading="isRunning"
        @confirm="performTurn"
      />

      <TreasuryModal
        v-model:open="isTreasuryOpen"
        :bastion
        @updated="emit('updated', $event)"
      />
    </template>
  </div>
</template>
