<script setup lang="ts">
  import type {
    ActiveEffect,
    EffectChange,
    EffectConditionKey,
    EffectFormLayout,
  } from '../../model';

  import {
    describeConditionName,
    EFFECT_CONDITION_BADGE_ICON,
    EFFECT_CONDITION_OPTIONS,
    EFFECT_MODIFIERS_STEP_LABELS,
  } from '../../model';
  import EffectChanges from './EffectChanges.vue';
  import EffectFlags from './EffectFlags.vue';

  /**
   * Шаг «Что меняет»: состояние, модификаторы, особые правила и иммунитеты к
   * состояниям.
   */
  defineProps<{
    /** Раскладка формы. */
    layout: EffectFormLayout;
    /** Показывать приоритет у всех модификаторов. */
    showPriorityField: boolean;
  }>();

  const effect = defineModel<ActiveEffect>('effect', { required: true });

  /** Название состояния, которым считается эффект. */
  const conditionBadgeLabel = computed(() =>
    effect.value.conditionKey
      ? `${EFFECT_MODIFIERS_STEP_LABELS.conditionPrefix}${describeConditionName(effect.value.conditionKey)}`
      : '',
  );

  const changes = computed({
    get: () => effect.value.changes,
    set: (value: EffectChange[]) => {
      effect.value = { ...effect.value, changes: value };
    },
  });

  const flags = computed({
    get: () => effect.value.flags,
    set: (value: string[]) => {
      effect.value = { ...effect.value, flags: value };
    },
  });

  const conditionImmunities = computed({
    get: () => effect.value.conditionImmunities ?? [],
    set: (keys: EffectConditionKey[]) => {
      effect.value = {
        ...effect.value,
        conditionImmunities: keys.length > 0 ? keys : undefined,
      };
    },
  });

  /**
   * Перестаёт считать эффект состоянием: модификаторы и правила остаются, но
   * иммунитет к состоянию на нём больше не сработает.
   */
  function removeCondition(): void {
    effect.value = {
      ...effect.value,
      conditionKey: undefined,
      exhaustionLevel: undefined,
    };
  }
</script>

<template>
  <div
    v-if="conditionBadgeLabel"
    class="flex flex-wrap items-center gap-2"
  >
    <UBadge
      color="primary"
      variant="subtle"
      size="lg"
      :icon="EFFECT_CONDITION_BADGE_ICON"
    >
      {{ conditionBadgeLabel }}
    </UBadge>

    <UButton
      color="neutral"
      variant="ghost"
      size="xs"
      icon="tabler:x"
      :label="EFFECT_MODIFIERS_STEP_LABELS.conditionRemove"
      :title="EFFECT_MODIFIERS_STEP_LABELS.conditionRemoveHint"
      @click.left.exact.prevent="removeCondition"
    />
  </div>

  <EffectChanges
    v-model="changes"
    :show-priority-field="showPriorityField"
  />

  <EffectFlags v-model="flags" />

  <div
    v-if="layout.showConditionImmunities"
    class="flex flex-col gap-1.5"
  >
    <div>
      <span class="text-sm font-medium">
        {{ EFFECT_MODIFIERS_STEP_LABELS.immunitiesTitle }}
      </span>

      <p class="text-xs text-muted">
        {{ EFFECT_MODIFIERS_STEP_LABELS.immunitiesHint }}
      </p>
    </div>

    <USelectMenu
      v-model="conditionImmunities"
      :items="EFFECT_CONDITION_OPTIONS"
      value-key="value"
      label-key="label"
      multiple
      class="w-full"
      :placeholder="EFFECT_MODIFIERS_STEP_LABELS.immunitiesPlaceholder"
    />
  </div>
</template>
