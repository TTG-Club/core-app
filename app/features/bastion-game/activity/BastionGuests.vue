<script setup lang="ts">
  import type { BastionGuest, PlayerBastion } from '../model';

  import { fillTemplate } from '~bastions/model';

  import { useBastionAction } from '../composables';
  import {
    BASTION_GUEST_ICONS,
    dismissBastionGuest,
    EVENT_LABELS,
  } from '../model';

  /**
   * Гости бастиона из событий: известные личности, наёмники, дружественные
   * монстры и беженцы. Мастер и игроки бастиона могут отослать гостя или
   * найти беженцам новый дом.
   */
  const { bastion } = defineProps<{
    bastion: PlayerBastion;
  }>();

  const emit = defineEmits<{
    updated: [bastion: PlayerBastion];
  }>();

  const { isRunning, run } = useBastionAction();

  const guests = computed(() => bastion.guests ?? []);

  const canDismiss = computed(
    () =>
      bastion.status === 'ACTIVE'
      && (bastion.canManage
        || bastion.members.some((member) => member.canGiveOrders)),
  );

  /**
   * Подпись гостя: кто, сколько, с какого хода и когда уедет.
   *
   * @param guest Гость.
   * @returns Подпись.
   */
  function getGuestTerms(guest: BastionGuest): string {
    const terms = fillTemplate(
      guest.count > 1 ? EVENT_LABELS.guestCount : EVENT_LABELS.guestTerms,
      { name: guest.name, count: guest.count, turn: guest.arrivedOnTurn },
    );

    return guest.leavesOnTurn
      ? terms
          + fillTemplate(EVENT_LABELS.guestLeaves, { turn: guest.leavesOnTurn })
      : terms;
  }

  /**
   * Подпись кнопки: беженцам находят дом, остальных отсылают.
   *
   * @param guest Гость.
   * @returns Подпись.
   */
  function getDismissLabel(guest: BastionGuest): string {
    return guest.kind.value === 'REFUGEES'
      ? EVENT_LABELS.dismissRefugees
      : EVENT_LABELS.dismiss;
  }

  /**
   * Отсылает гостя.
   *
   * @param guestId Гость.
   */
  async function dismiss(guestId: string): Promise<void> {
    const updated = await run(
      () => dismissBastionGuest(bastion.id, guestId),
      EVENT_LABELS.dismissed,
    );

    if (updated) {
      emit('updated', updated);
    }
  }
</script>

<template>
  <section
    v-if="guests.length"
    class="flex flex-col gap-2"
  >
    <h2 class="text-base font-semibold text-highlighted">
      {{ EVENT_LABELS.guestsTitle }}
    </h2>

    <ul class="flex flex-wrap gap-2">
      <li
        v-for="guest in guests"
        :key="guest.id"
        class="flex items-center gap-2 rounded-lg bg-elevated/40 px-3 py-1.5 text-sm"
      >
        <UTooltip :text="guest.kind.name">
          <UIcon
            :name="BASTION_GUEST_ICONS[guest.kind.value]"
            class="size-4 text-info"
          />
        </UTooltip>

        <span class="text-toned">{{ getGuestTerms(guest) }}</span>

        <UButton
          v-if="canDismiss"
          size="xs"
          color="neutral"
          variant="ghost"
          :loading="isRunning"
          @click.left.exact.prevent="dismiss(guest.id)"
        >
          {{ getDismissLabel(guest) }}
        </UButton>
      </li>
    </ul>
  </section>
</template>
