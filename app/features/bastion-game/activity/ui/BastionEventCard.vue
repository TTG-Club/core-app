<script setup lang="ts">
  import type {
    BastionEvent,
    BastionEventDecision,
    PlayerBastion,
  } from '../../model';

  import { fillTemplate } from '~bastions/model';

  import { useBastionAction } from '../../composables';
  import {
    BASTION_EVENT_COLORS,
    BASTION_EVENT_ICONS,
    decideBastionEvent,
    EVENT_LABELS,
  } from '../../model';

  /**
   * Событие бастиона: что выпало на 1к100 и чем закончилось. Если событие ждёт
   * выбора — взятка, удачный случай, просьба о помощи, полученный предмет, —
   * игрок персонажа или Мастер принимают решение прямо здесь.
   */
  const { bastion, event } = defineProps<{
    bastion: PlayerBastion;
    event: BastionEvent;
  }>();

  const emit = defineEmits<{
    updated: [bastion: PlayerBastion];
  }>();

  const { isRunning, run } = useBastionAction();

  const defenders = ref<number>(1);
  const note = ref('');

  const isPending = computed(() => event.status === 'PENDING');

  const terms = computed(() =>
    fillTemplate(
      event.characterName ? EVENT_LABELS.terms : EVENT_LABELS.termsNoCharacter,
      {
        turn: event.turn,
        character: event.characterName ?? '',
        roll: event.roll,
      },
    ),
  );

  const diceText = computed(() =>
    event.details.dice?.length
      ? fillTemplate(EVENT_LABELS.dice, {
          dice: event.details.dice.join(', '),
        })
      : '',
  );

  const canDecide = computed(
    () => isPending.value && event.canDecide && event.decisions.length > 0,
  );

  const canPay = computed(() => event.decisions.includes('PAY'));
  const canSend = computed(() => event.decisions.includes('SEND'));
  const canRecord = computed(() => event.decisions.includes('RECORD'));
  const canRefuse = computed(() => event.decisions.includes('REFUSE'));

  const payLabel = computed(() =>
    fillTemplate(EVENT_LABELS.pay, { cost: event.details.amountGp ?? 0 }),
  );

  const refuseLabel = computed(() =>
    event.type.value === 'CRIMINAL_HIRELING'
      ? EVENT_LABELS.arrest
      : EVENT_LABELS.refuse,
  );

  const sendHint = computed(() =>
    fillTemplate(EVENT_LABELS.sendHint, { count: event.defenders }),
  );

  const isPayDisabled = computed(
    () => (event.details.amountGp ?? 0) > bastion.treasuryGp,
  );

  const isRecordDisabled = computed(() => !note.value.trim());

  /**
   * Отправляет решение по событию.
   *
   * @param decision Решение.
   */
  async function decide(decision: BastionEventDecision): Promise<void> {
    const updated = await run(
      () =>
        decideBastionEvent(bastion.id, event.id, {
          decision,
          ...(decision === 'SEND' ? { defenders: defenders.value } : {}),
          ...(decision === 'RECORD' ? { note: note.value.trim() } : {}),
        }),
      EVENT_LABELS.decided,
    );

    if (updated) {
      emit('updated', updated);
    }
  }
</script>

<template>
  <div class="flex flex-col gap-2 rounded-lg bg-elevated/40 px-3 py-2">
    <div class="flex flex-wrap items-center gap-2">
      <UBadge
        :icon="BASTION_EVENT_ICONS[event.type.value]"
        :color="BASTION_EVENT_COLORS[event.type.value]"
        variant="subtle"
      >
        {{ event.type.name }}
      </UBadge>

      <UBadge
        v-if="isPending"
        color="warning"
        variant="outline"
        size="sm"
      >
        {{ EVENT_LABELS.pending }}
      </UBadge>

      <span class="text-xs text-muted tabular-nums">
        {{ terms }}
      </span>
    </div>

    <p class="text-sm text-toned">
      {{ event.summary }}
    </p>

    <p
      v-if="diceText"
      class="text-xs text-muted tabular-nums"
    >
      {{ diceText }}
    </p>

    <div
      v-if="canDecide"
      class="flex flex-wrap items-end gap-2"
    >
      <UButton
        v-if="canPay"
        icon="tabler:coins"
        size="sm"
        :loading="isRunning"
        :disabled="isPayDisabled"
        @click.left.exact.prevent="decide('PAY')"
      >
        {{ payLabel }}
      </UButton>

      <template v-if="canSend">
        <UFormField
          v-if="event.defenders"
          :label="EVENT_LABELS.sendDefenders"
          :help="sendHint"
        >
          <UInputNumber
            :id="`bastion-event-defenders-${event.id}`"
            v-model="defenders"
            :min="1"
            :max="event.defenders"
            size="sm"
            class="w-32"
          />
        </UFormField>

        <UButton
          v-if="event.defenders"
          icon="tabler:shield"
          size="sm"
          :loading="isRunning"
          @click.left.exact.prevent="decide('SEND')"
        >
          {{ EVENT_LABELS.send }}
        </UButton>

        <p
          v-else
          class="text-sm text-muted"
        >
          {{ EVENT_LABELS.noDefenders }}
        </p>
      </template>

      <template v-if="canRecord">
        <UFormField
          :label="EVENT_LABELS.recordLabel"
          class="min-w-64 flex-1"
        >
          <UInput
            :id="`bastion-event-note-${event.id}`"
            v-model="note"
            :maxlength="500"
            :placeholder="EVENT_LABELS.recordPlaceholder"
            size="sm"
            class="w-full"
          />
        </UFormField>

        <UButton
          icon="tabler:pencil"
          size="sm"
          :loading="isRunning"
          :disabled="isRecordDisabled"
          @click.left.exact.prevent="decide('RECORD')"
        >
          {{ EVENT_LABELS.record }}
        </UButton>
      </template>

      <UButton
        v-if="canRefuse"
        size="sm"
        color="neutral"
        variant="subtle"
        :loading="isRunning"
        @click.left.exact.prevent="decide('REFUSE')"
      >
        {{ refuseLabel }}
      </UButton>
    </div>

    <p
      v-else-if="isPending"
      class="text-xs text-muted"
    >
      {{ EVENT_LABELS.waiting }}
    </p>
  </div>
</template>
