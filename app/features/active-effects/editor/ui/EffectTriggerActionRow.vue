<script setup lang="ts">
  import type {
    EffectConditionKey,
    EffectDamagePart,
    EffectTriggerAction,
    EffectTriggerSave,
  } from '../../model';

  import {
    EFFECT_CONDITION_OPTIONS,
    EFFECT_TRIGGER_ACTION_ICONS,
    EFFECT_TRIGGER_ACTION_LABELS,
    EFFECT_TRIGGER_DAMAGE_GATE_OPTIONS,
    EFFECT_TRIGGER_DAMAGE_HALF_GATE,
    EFFECT_TRIGGER_GATE_OPTIONS,
    EFFECT_TRIGGER_ROW_ICONS,
    EFFECT_TRIGGER_ROW_LABELS,
    isEffectTag,
    MIN_SET_HP_VALUE,
    MIN_TRIGGER_ACTION_ROUNDS,
    readTriggerActionRounds,
    resolveTriggerActionGate,
    writeTriggerActionGate,
    writeTriggerActionRounds,
  } from '../../model';
  import EffectDamageParts from './EffectDamageParts.vue';

  /**
   * Действие строки срабатывания: вид, исход относительно спасброска строки и
   * поля вида — части урона, состояние и срок, число хитов, ключ и имя отметки.
   */
  const { triggerSave = undefined } = defineProps<{
    /** Спасбросок строки: без него исход действия не выбирается. */
    triggerSave?: EffectTriggerSave;
  }>();

  const emit = defineEmits<{
    /** Убрать действие из строки. */
    remove: [];
  }>();

  /** Действие: поля заменяют его целиком при каждой правке. */
  const action = defineModel<EffectTriggerAction>('action', {
    required: true,
  });

  const actionLabel = computed(
    () => EFFECT_TRIGGER_ACTION_LABELS[action.value.type],
  );

  const actionIcon = computed(
    () => EFFECT_TRIGGER_ACTION_ICONS[action.value.type],
  );

  /** Исход действия; не заданный — по спасброску строки. */
  const gate = computed(() =>
    resolveTriggerActionGate({ save: triggerSave }, action.value),
  );

  /** Исход урона для выбора: «успех — половина» — отдельный вариант. */
  const damageGate = computed(() => {
    const currentAction = action.value;

    return currentAction.type === 'damage' && currentAction.halfOnSave
      ? EFFECT_TRIGGER_DAMAGE_HALF_GATE
      : gate.value;
  });

  /** Срок состояния или отметки в раундах. */
  const rounds = computed(() => readTriggerActionRounds(action.value));

  /** Состояние действия, если оно из списка выбора. */
  const conditionKey = computed<EffectConditionKey | undefined>(() => {
    const currentAction = action.value;

    return currentAction.type === 'applyCondition'
      ? EFFECT_CONDITION_OPTIONS.find(
          (conditionOption) =>
            conditionOption.value === currentAction.conditionKey,
        )?.value
      : undefined;
  });

  /** Ошибка ключа отметки. */
  const tagError = computed(() => {
    const currentAction = action.value;

    return currentAction.type === 'applyTag' && !isEffectTag(currentAction.tag)
      ? EFFECT_TRIGGER_ROW_LABELS.tagInvalid
      : undefined;
  });

  /**
   * Меняет исход действия по выбору в списке.
   *
   * @param selectedGate значение из списка исходов.
   */
  function selectGate(selectedGate: unknown): void {
    const choice = EFFECT_TRIGGER_DAMAGE_GATE_OPTIONS.find(
      (gateOption) => gateOption.value === selectedGate,
    )?.value;

    if (!choice) {
      return;
    }

    const nextAction = writeTriggerActionGate(action.value, choice);

    if (nextAction) {
      action.value = nextAction;
    }
  }

  /**
   * Меняет части урона.
   *
   * @param parts части урона.
   */
  function updateDamageParts(parts: EffectDamagePart[]): void {
    const currentAction = action.value;

    if (currentAction.type === 'damage') {
      action.value = { ...currentAction, parts };
    }
  }

  /**
   * Меняет состояние действия.
   *
   * @param nextConditionKey ключ состояния.
   */
  function updateCondition(nextConditionKey: EffectConditionKey): void {
    const currentAction = action.value;

    if (currentAction.type === 'applyCondition') {
      action.value = { ...currentAction, conditionKey: nextConditionKey };
    }
  }

  /**
   * Меняет срок состояния или отметки в раундах; пусто — срок по умолчанию
   * (состояние — пока не снимут, отметка — до начала следующего хода).
   *
   * @param nextRounds раундов.
   */
  function updateActionRounds(nextRounds: number | null | undefined): void {
    action.value = writeTriggerActionRounds(action.value, nextRounds);
  }

  /**
   * Меняет число хитов действия «Хиты становятся».
   *
   * @param hitPoints хитов; очищенное поле — наименьшее число.
   */
  function updateSetHp(hitPoints: number | null | undefined): void {
    const currentAction = action.value;

    if (currentAction.type === 'setHp') {
      action.value = {
        ...currentAction,
        value: Math.max(MIN_SET_HP_VALUE, hitPoints ?? MIN_SET_HP_VALUE),
      };
    }
  }

  /**
   * Меняет ключ отметки.
   *
   * @param nextTag новый ключ.
   */
  function updateTagKey(nextTag: string): void {
    const currentAction = action.value;

    if (currentAction.type === 'applyTag') {
      action.value = { ...currentAction, tag: nextTag.trim() };
    }
  }

  /**
   * Меняет имя отметки в списке; пустое имя — как ключ.
   *
   * @param nextLabel новое имя.
   */
  function updateTagLabel(nextLabel: string): void {
    const currentAction = action.value;

    if (currentAction.type === 'applyTag') {
      action.value = {
        ...currentAction,
        label: nextLabel.trim() || undefined,
      };
    }
  }
</script>

<template>
  <div class="flex flex-col gap-2 border-l-2 border-default pl-3">
    <div class="flex flex-wrap items-center gap-2">
      <UIcon
        :name="actionIcon"
        class="size-4 text-muted"
      />

      <span class="text-xs text-default">
        {{ actionLabel }}
      </span>

      <template v-if="triggerSave">
        <USelect
          v-if="action.type === 'damage'"
          :model-value="damageGate"
          :items="EFFECT_TRIGGER_DAMAGE_GATE_OPTIONS"
          value-key="value"
          size="xs"
          class="w-64 max-w-full"
          :aria-label="EFFECT_TRIGGER_ROW_LABELS.gate"
          @update:model-value="selectGate"
        />

        <USelect
          v-else
          :model-value="gate"
          :items="EFFECT_TRIGGER_GATE_OPTIONS"
          value-key="value"
          size="xs"
          class="w-40"
          :aria-label="EFFECT_TRIGGER_ROW_LABELS.gate"
          @update:model-value="selectGate"
        />
      </template>

      <UButton
        color="neutral"
        variant="ghost"
        size="xs"
        :icon="EFFECT_TRIGGER_ROW_ICONS.removeAction"
        class="ml-auto"
        :aria-label="EFFECT_TRIGGER_ROW_LABELS.removeAction"
        @click.left.exact.prevent="emit('remove')"
      />
    </div>

    <EffectDamageParts
      v-if="action.type === 'damage'"
      :model-value="action.parts"
      allow-healing
      @update:model-value="updateDamageParts"
    />

    <div
      v-else-if="action.type === 'applyCondition'"
      class="flex flex-wrap items-end gap-2"
    >
      <UFormField
        :label="EFFECT_TRIGGER_ROW_LABELS.condition"
        class="w-56"
      >
        <USelect
          :model-value="conditionKey"
          :items="EFFECT_CONDITION_OPTIONS"
          value-key="value"
          size="sm"
          class="w-full"
          @update:model-value="updateCondition"
        />
      </UFormField>

      <UFormField
        :label="EFFECT_TRIGGER_ROW_LABELS.conditionRounds"
        class="w-40"
      >
        <UInputNumber
          :model-value="rounds"
          :min="MIN_TRIGGER_ACTION_ROUNDS"
          :placeholder="EFFECT_TRIGGER_ROW_LABELS.conditionRoundsPlaceholder"
          size="sm"
          class="w-full"
          @update:model-value="updateActionRounds"
        />
      </UFormField>
    </div>

    <UFormField
      v-else-if="action.type === 'setHp'"
      :label="EFFECT_TRIGGER_ROW_LABELS.setHpValue"
      class="w-32"
    >
      <UInputNumber
        :model-value="action.value"
        :min="MIN_SET_HP_VALUE"
        size="sm"
        class="w-full"
        @update:model-value="updateSetHp"
      />
    </UFormField>

    <div
      v-else-if="action.type === 'applyTag'"
      class="flex flex-wrap items-start gap-2"
    >
      <UFormField
        :label="EFFECT_TRIGGER_ROW_LABELS.tag"
        :error="tagError"
        class="w-56"
      >
        <UInput
          :model-value="action.tag"
          size="sm"
          class="w-full"
          @update:model-value="updateTagKey"
        />
      </UFormField>

      <UFormField
        :label="EFFECT_TRIGGER_ROW_LABELS.tagLabel"
        class="w-48"
      >
        <UInput
          :model-value="action.label"
          :placeholder="EFFECT_TRIGGER_ROW_LABELS.tagLabelPlaceholder"
          size="sm"
          class="w-full"
          @update:model-value="updateTagLabel"
        />
      </UFormField>

      <UFormField
        :label="EFFECT_TRIGGER_ROW_LABELS.conditionRounds"
        class="w-52"
      >
        <UInputNumber
          :model-value="rounds"
          :min="MIN_TRIGGER_ACTION_ROUNDS"
          :placeholder="EFFECT_TRIGGER_ROW_LABELS.tagRoundsPlaceholder"
          size="sm"
          class="w-full"
          @update:model-value="updateActionRounds"
        />
      </UFormField>
    </div>
  </div>
</template>
