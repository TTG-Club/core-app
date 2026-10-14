<script setup lang="ts">
  import type { TabsItem } from '@nuxt/ui';

  import type {
    BastionActivity,
    BastionActivityOrder,
    PlayerBastion,
  } from '../model';

  import { fillTemplate } from '~bastions/model';
  import { ParticipantName } from '~find-game/ui';

  import { useBastionAction } from '../composables';
  import {
    ACTIVITY_LABELS,
    cancelBastionOrder,
    formatLedgerAmount,
    getOrderTitle,
    LEDGER_REASON_LABELS,
    ORDER_STATUS_COLORS,
  } from '../model';

  /**
   * Журнал бастиона: приказы, ходы и казна. Приказ текущего хода можно
   * отменить — цена вернётся в казну.
   */
  const { bastion, activity } = defineProps<{
    bastion: PlayerBastion;
    activity: BastionActivity | undefined;
  }>();

  const emit = defineEmits<{
    updated: [bastion: PlayerBastion];
  }>();

  const { run } = useBastionAction();

  const tabs: Array<TabsItem> = [
    { label: ACTIVITY_LABELS.ordersTab, slot: 'orders', value: 'orders' },
    { label: ACTIVITY_LABELS.turnsTab, slot: 'turns', value: 'turns' },
    { label: ACTIVITY_LABELS.ledgerTab, slot: 'ledger', value: 'ledger' },
  ];

  /**
   * Сроки приказа.
   *
   * @param order Приказ.
   * @returns «отдан на ходу 2, срок — ход 3».
   */
  function getOrderTerms(order: BastionActivityOrder): string {
    return fillTemplate(ACTIVITY_LABELS.orderTerms, {
      given: order.givenOnTurn,
      completes: order.completesOnTurn,
    });
  }

  /**
   * Подпись хода.
   *
   * @param turn Номер хода.
   * @returns «Ход 3».
   */
  function getTurnLabel(turn: number): string {
    return fillTemplate(ACTIVITY_LABELS.turnLabel, { turn });
  }

  /**
   * Отменяет приказ.
   *
   * @param orderId Приказ.
   */
  async function cancel(orderId: string): Promise<void> {
    const updated = await run(
      () => cancelBastionOrder(bastion.id, orderId),
      ACTIVITY_LABELS.cancelled,
    );

    if (updated) {
      emit('updated', updated);
    }
  }
</script>

<template>
  <UCard variant="subtle">
    <template #header>
      <h2 class="text-base font-semibold text-highlighted">
        {{ ACTIVITY_LABELS.journal }}
      </h2>
    </template>

    <UTabs
      :items="tabs"
      variant="link"
      :ui="{ list: 'justify-start', content: 'pt-3' }"
    >
      <template #orders>
        <p
          v-if="!activity?.orders.length"
          class="text-sm text-muted"
        >
          {{ ACTIVITY_LABELS.noOrders }}
        </p>

        <ul
          v-else
          class="flex flex-col gap-2"
        >
          <li
            v-for="order in activity.orders"
            :key="order.id"
            class="flex flex-col gap-1 rounded-lg bg-elevated/40 px-3 py-2"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="font-medium text-highlighted">
                {{ getOrderTitle(order) }}
              </span>

              <div class="flex items-center gap-2">
                <UBadge
                  :color="ORDER_STATUS_COLORS[order.status]"
                  variant="subtle"
                  size="sm"
                >
                  {{ ACTIVITY_LABELS.status[order.status] }}
                </UBadge>

                <UButton
                  v-if="order.canCancel"
                  size="xs"
                  color="neutral"
                  variant="ghost"
                  @click.left.exact.prevent="cancel(order.id)"
                >
                  {{ ACTIVITY_LABELS.cancel }}
                </UButton>
              </div>
            </div>

            <span class="text-xs text-muted">
              {{ getOrderTerms(order) }} ·
              <ParticipantName :user-id="order.givenBy" />
            </span>

            <p
              v-if="order.note"
              class="text-sm text-toned"
            >
              {{ order.note }}
            </p>

            <p
              v-if="order.result"
              class="text-sm text-highlighted"
            >
              {{ order.result }}
            </p>
          </li>
        </ul>
      </template>

      <template #turns>
        <p
          v-if="!activity?.turns.length"
          class="text-sm text-muted"
        >
          {{ ACTIVITY_LABELS.noTurns }}
        </p>

        <ul
          v-else
          class="flex flex-col gap-2"
        >
          <li
            v-for="turn in activity.turns"
            :key="turn.number"
            class="flex flex-col gap-1 rounded-lg bg-elevated/40 px-3 py-2"
          >
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-medium text-highlighted">
                {{ getTurnLabel(turn.number) }}
              </span>

              <UBadge
                v-if="turn.maintain"
                color="warning"
                variant="subtle"
                size="sm"
              >
                {{ ACTIVITY_LABELS.maintain }}
              </UBadge>
            </div>

            <p
              v-if="turn.event"
              class="text-sm text-toned"
            >
              {{ turn.event }}
            </p>

            <ul class="flex flex-col gap-0.5 text-sm text-muted">
              <li
                v-for="(line, index) in turn.summary"
                :key="index"
              >
                {{ line }}
              </li>
            </ul>
          </li>
        </ul>
      </template>

      <template #ledger>
        <p
          v-if="!activity?.ledger.length"
          class="text-sm text-muted"
        >
          {{ ACTIVITY_LABELS.noLedger }}
        </p>

        <ul
          v-else
          class="flex flex-col divide-y divide-default"
        >
          <li
            v-for="(entry, index) in activity.ledger"
            :key="index"
            class="flex flex-wrap items-baseline justify-between gap-2 py-2 text-sm"
          >
            <span class="min-w-0">
              <span class="text-highlighted">
                {{ LEDGER_REASON_LABELS[entry.reason] }}
              </span>

              <span
                v-if="entry.note"
                class="text-muted"
              >
                · {{ entry.note }}
              </span>
            </span>

            <span
              class="tabular-nums"
              :class="entry.amountGp > 0 ? 'text-success' : 'text-error'"
            >
              {{ formatLedgerAmount(entry.amountGp) }}
            </span>
          </li>
        </ul>
      </template>
    </UTabs>
  </UCard>
</template>
