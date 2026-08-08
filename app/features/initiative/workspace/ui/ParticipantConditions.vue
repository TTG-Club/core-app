<script setup lang="ts">
  import type {
    ConditionExpiry,
    ConditionKey,
    ParticipantCondition,
  } from '~initiative/model';

  import {
    CONDITION_CATALOG,
    CONDITION_EXPIRY_OPTIONS,
    CONDITION_KEYS,
    CONDITION_LABELS,
    CONDITION_ROUNDS_PLURAL,
    DEFAULT_CONDITION_EXPIRY,
    DEFAULT_CONDITION_ROUNDS,
    MAX_CONDITION_ROUNDS,
  } from '~initiative/model';

  const {
    conditions = [],
    round = 0,
    disabled = false,
  } = defineProps<{
    /** Наложенные состояния участника. */
    conditions?: Array<ParticipantCondition>;
    /** Текущий раунд боя — из него считается остаток длительности. */
    round?: number;
    disabled?: boolean;
  }>();

  const emit = defineEmits<{
    add: [key: ConditionKey, rounds: number, expiry: ConditionExpiry];
    remove: [key: ConditionKey];
  }>();

  const isAddOpen = ref(false);

  // Длительность и момент снятия задаются один раз на открытие палитры: мастер
  // накладывает «на два раунда» сразу нескольким участникам подряд.
  const rounds = ref(DEFAULT_CONDITION_ROUNDS);
  const expiry = ref<ConditionExpiry>(DEFAULT_CONDITION_EXPIRY);

  const isTimed = computed(() => rounds.value > 0);

  const appliedKeys = computed(
    () => new Set(conditions.map((condition) => condition.key)),
  );

  /**
   * Подсказка состояния: название и остаток длительности.
   * @param condition Наложенное состояние.
   */
  function conditionTooltip(condition: ParticipantCondition): string {
    const { label } = CONDITION_CATALOG[condition.key];

    if (condition.expiresAtRound === null) {
      return `${label} · ${CONDITION_LABELS.permanent}`;
    }

    const left = Math.max(0, condition.expiresAtRound - round);
    const noun = getPlural(left, CONDITION_ROUNDS_PLURAL);

    const moment = CONDITION_EXPIRY_OPTIONS.find(
      (option) => option.value === condition.expiresOn,
    );

    return `${label} · ещё ${left} ${noun} · ${moment?.label ?? ''}`;
  }

  /**
   * Накладывает состояние с выбранной длительностью и закрывает палитру.
   * @param key Ключ состояния.
   */
  function add(key: ConditionKey): void {
    isAddOpen.value = false;

    emit('add', key, rounds.value, expiry.value);
  }

  /**
   * Снимает состояние.
   * @param key Ключ состояния.
   */
  function remove(key: ConditionKey): void {
    emit('remove', key);
  }
</script>

<template>
  <div class="flex flex-wrap items-center gap-1">
    <UTooltip
      v-for="condition in conditions"
      :key="condition.key"
      :text="conditionTooltip(condition)"
    >
      <UButton
        :icon="CONDITION_CATALOG[condition.key].icon"
        color="warning"
        variant="soft"
        size="xs"
        :disabled
        :aria-label="`${CONDITION_LABELS.remove}: ${CONDITION_CATALOG[condition.key].label}`"
        @click.left.exact.prevent="remove(condition.key)"
      />
    </UTooltip>

    <UPopover v-model:open="isAddOpen">
      <UTooltip :text="CONDITION_LABELS.add">
        <UButton
          icon="tabler:plus"
          color="neutral"
          variant="ghost"
          size="xs"
          :disabled
          :aria-label="CONDITION_LABELS.add"
        />
      </UTooltip>

      <template #content>
        <div class="flex w-64 flex-col gap-2">
          <UFormField
            :label="CONDITION_LABELS.rounds"
            :help="CONDITION_LABELS.roundsHint"
          >
            <UInputNumber
              v-model="rounds"
              :min="DEFAULT_CONDITION_ROUNDS"
              :max="MAX_CONDITION_ROUNDS"
              class="w-full"
            />
          </UFormField>

          <!-- Момент снятия нужен только состоянию со сроком: бессрочное
               держится до снятия вручную, и выбирать тут нечего. -->
          <UFormField
            v-if="isTimed"
            :label="CONDITION_LABELS.expiry"
          >
            <USelect
              v-model="expiry"
              :items="CONDITION_EXPIRY_OPTIONS"
              value-key="value"
              class="w-full"
            />
          </UFormField>

          <div class="grid grid-cols-5 gap-1">
            <UTooltip
              v-for="key in CONDITION_KEYS"
              :key="key"
              :text="CONDITION_CATALOG[key].label"
            >
              <UButton
                class="w-full justify-center"
                :icon="CONDITION_CATALOG[key].icon"
                :color="appliedKeys.has(key) ? 'warning' : 'neutral'"
                :variant="appliedKeys.has(key) ? 'soft' : 'ghost'"
                :aria-label="CONDITION_CATALOG[key].label"
                @click.left.exact.prevent="add(key)"
              />
            </UTooltip>
          </div>
        </div>
      </template>
    </UPopover>
  </div>
</template>
