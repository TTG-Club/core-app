<script setup lang="ts">
  import type { BastionActivity, PlayerBastion } from '../model';

  import { useBastionAction } from '../composables';
  import { ACTIVITY_LABELS, giveBastionOrder } from '../model';
  import { TreasuryModal, TurnModal } from './ui';

  /**
   * Действия запущенного бастиона: «Обслуживать» — мастеру и игрокам с
   * доступом, ход и казна — только мастеру.
   */
  const { bastion, activity } = defineProps<{
    bastion: PlayerBastion;
    activity: BastionActivity | undefined;
  }>();

  const emit = defineEmits<{
    updated: [bastion: PlayerBastion];
  }>();

  const { isRunning, run } = useBastionAction();

  const isTurnOpen = ref(false);
  const isTreasuryOpen = ref(false);

  const isActive = computed(() => bastion.status === 'ACTIVE');

  const canMaintain = computed(
    () =>
      isActive.value
      && (bastion.canManage
        || bastion.members.some((member) => member.canGiveOrders)),
  );

  /** Отдаёт «Обслуживать» всему бастиону. */
  async function maintain(): Promise<void> {
    const updated = await run(
      () => giveBastionOrder(bastion.id, { order: 'MAINTAIN' }),
      ACTIVITY_LABELS.orderGiven,
    );

    if (updated) {
      emit('updated', updated);
    }
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
        @click.left.exact.prevent="isTurnOpen = true"
      >
        {{ ACTIVITY_LABELS.turn }}
      </UButton>

      <TurnModal
        v-model:open="isTurnOpen"
        :bastion
        :activity
        @updated="emit('updated', $event)"
      />

      <TreasuryModal
        v-model:open="isTreasuryOpen"
        :bastion
        @updated="emit('updated', $event)"
      />
    </template>
  </div>
</template>
