<script setup lang="ts">
  import type { BastionActivity, PlayerBastion } from '../model';

  import { fillTemplate } from '~bastions/model';

  import { ACTIVITY_LABELS, LAST_TURN_LABELS } from '../model';
  import { BastionEventCard } from './ui';

  /**
   * Итоги последнего хода над персонажами: что завершилось и какие события
   * выпали, чтобы не искать их в журнале внизу страницы. События, которые
   * ждут решения, показывает `BastionPendingEvents`, здесь о них только
   * упоминание, если своих итогов у хода нет. Скрытые
   * итоги снова появятся после следующего хода.
   */
  const { bastion, activity } = defineProps<{
    bastion: PlayerBastion;
    activity: BastionActivity | undefined;
  }>();

  const emit = defineEmits<{
    updated: [bastion: PlayerBastion];
  }>();

  /** Номер хода, итоги которого пользователь скрыл: свой для каждого бастиона. */
  const hiddenTurn = useLocalStorage<number>(
    () => `bastion-last-turn-hidden-${bastion.id}`,
    0,
  );

  const lastTurn = computed(() =>
    activity?.turns.reduce<BastionActivity['turns'][number] | undefined>(
      (latest, turn) =>
        !latest || turn.number > latest.number ? turn : latest,
      undefined,
    ),
  );

  /**
   * Ход, на котором выпали события этих итогов: «Обслуживать» бросает
   * событие до перехода хода, поэтому у событий итогов хода N номер N − 1.
   */
  const eventsTurn = computed(() =>
    lastTurn.value ? lastTurn.value.number - 1 : undefined,
  );

  const resolvedEvents = computed(
    () =>
      activity?.events.filter(
        (event) =>
          event.turn === eventsTurn.value && event.status !== 'PENDING',
      ) ?? [],
  );

  /** События, которые ждут решения: их показывает `BastionPendingEvents` ниже. */
  const pendingEvents = computed(
    () => activity?.events.filter((event) => event.status === 'PENDING') ?? [],
  );

  const isVisible = computed(
    () => !!lastTurn.value && lastTurn.value.number !== hiddenTurn.value,
  );

  const isEmpty = computed(
    () =>
      !lastTurn.value?.event
      && !lastTurn.value?.summary.length
      && !resolvedEvents.value.length,
  );

  /**
   * Что написать, когда у хода нет своих итогов: если ниже ждут решения
   * события, «ничего не произошло» читалось бы как противоречие.
   */
  const emptyText = computed(() => {
    const pending = pendingEvents.value;

    if (!pending.length) {
      return LAST_TURN_LABELS.nothing;
    }

    return pending.some((event) => event.turn === eventsTurn.value)
      ? LAST_TURN_LABELS.pendingNow
      : fillTemplate(LAST_TURN_LABELS.pendingEarlier, {
          count: pending.length,
        });
  });

  const title = computed(() =>
    fillTemplate(LAST_TURN_LABELS.title, {
      turn: lastTurn.value?.number ?? '',
    }),
  );

  /** Прячет итоги до следующего хода. */
  function hide(): void {
    if (lastTurn.value) {
      hiddenTurn.value = lastTurn.value.number;
    }
  }
</script>

<template>
  <UCard
    v-if="isVisible && lastTurn"
    variant="subtle"
    :ui="{ root: 'ring-info/40' }"
  >
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <h2
          class="flex items-center gap-2 text-base font-semibold text-highlighted"
        >
          <UIcon
            name="tabler:hourglass"
            class="size-5 text-info"
          />

          {{ title }}

          <UBadge
            v-if="lastTurn.maintain"
            color="warning"
            variant="subtle"
            size="sm"
          >
            {{ ACTIVITY_LABELS.maintain }}
          </UBadge>
        </h2>

        <UTooltip :text="LAST_TURN_LABELS.hide">
          <UButton
            icon="tabler:x"
            color="neutral"
            variant="ghost"
            size="xs"
            :aria-label="LAST_TURN_LABELS.hide"
            @click.left.exact.prevent="hide"
          />
        </UTooltip>
      </div>
    </template>

    <div class="flex flex-col gap-3">
      <p
        v-if="isEmpty"
        class="text-sm text-muted"
      >
        {{ emptyText }}
      </p>

      <p
        v-if="lastTurn.event"
        class="text-sm text-toned"
      >
        {{ lastTurn.event }}
      </p>

      <ul
        v-if="lastTurn.summary.length"
        class="flex flex-col gap-0.5 text-sm text-toned"
      >
        <li
          v-for="(line, index) in lastTurn.summary"
          :key="index"
        >
          {{ line }}
        </li>
      </ul>

      <div
        v-if="resolvedEvents.length"
        class="flex flex-col gap-2"
      >
        <BastionEventCard
          v-for="event in resolvedEvents"
          :key="event.id"
          :bastion
          :event
          @updated="emit('updated', $event)"
        />
      </div>
    </div>
  </UCard>
</template>
