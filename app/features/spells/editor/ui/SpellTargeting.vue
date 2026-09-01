<script setup lang="ts">
  import type { SpellEffect } from '../../model';

  import { SelectAttackType, SelectSpellArea } from '~ui/select';

  import {
    createEmptySpellScaling,
    SPELL_ATTACK_DELIVERY_TYPES,
    SPELL_DELIVERY_TYPE_OPTIONS,
    SPELL_EFFECT_LABELS,
    SPELL_TARGET_COUNT_MIN,
    SPELL_TARGET_TYPE_OPTIONS,
  } from '../../model';

  const { level } = defineProps<{
    level: number; // круг заклинания: у заговора числу целей не за что расти
  }>();

  const model = defineModel<SpellEffect>({ required: true });

  const showTargetCount = computed(() => {
    // У снарядных заклинаний число целей задаёт снарядный режим.
    if (model.value.projectiles) {
      return false;
    }

    const targetType = model.value.targetType;

    return targetType === 'CREATURE' || targetType === 'OBJECT';
  });

  // Рост числа целей за круг — только у уровневых заклинаний с целями-существами
  // или предметами: у снарядных за это отвечает снарядный режим.
  const showScalingTargets = computed(() => level > 0 && showTargetCount.value);

  const scalingAdditionalTargets = computed({
    get: () => model.value.scaling?.additionalTargets,
    set: (value) => {
      model.value = {
        ...model.value,
        scaling: {
          ...(model.value.scaling ?? createEmptySpellScaling()),
          additionalTargets: value,
        },
      };
    },
  });

  // Бонус к атаке осмыслен только там, где есть сам бросок атаки.
  const showAttackBonus = computed(() => {
    const deliveryType = model.value.deliveryType;

    return (
      deliveryType !== undefined
      && SPELL_ATTACK_DELIVERY_TYPES.includes(deliveryType)
    );
  });

  const showAreaOfEffect = computed(() => model.value.targetType === 'AREA');

  const showValue2 = computed(() => {
    const areaType = model.value.areaOfEffect?.type;

    return areaType === 'LINE' || areaType === 'CYLINDER';
  });

  const showAutoHitWarning = computed(() => {
    if (!model.value.autoHit) {
      return false;
    }

    const hasAttackType = !!model.value.attackType;
    const hasSavingThrows = (model.value.savingThrows?.length ?? 0) > 0;

    return hasAttackType || hasSavingThrows;
  });
</script>

<template>
  <div class="grid grid-cols-24 gap-4">
    <!-- Тип цели -->
    <UFormField
      class="col-span-full md:col-span-12 xl:col-span-6"
      :label="SPELL_EFFECT_LABELS.targetType"
      name="effect.targetType"
    >
      <USelect
        v-model="model.targetType"
        :items="SPELL_TARGET_TYPE_OPTIONS"
        :placeholder="SPELL_EFFECT_LABELS.targetTypePlaceholder"
        clearable
      />
    </UFormField>

    <!-- Количество целей (только для CREATURE и OBJECT) -->
    <UFormField
      v-if="showTargetCount"
      class="col-span-full md:col-span-12 xl:col-span-6"
      :label="SPELL_EFFECT_LABELS.targetCount"
      name="effect.targetCount"
    >
      <UInput
        v-model.number="model.targetCount"
        type="number"
        :placeholder="SPELL_EFFECT_LABELS.targetCountPlaceholder"
        :min="SPELL_TARGET_COUNT_MIN"
      />
    </UFormField>

    <!-- Рост числа целей за круг усиления -->
    <UFormField
      v-if="showScalingTargets"
      class="col-span-full md:col-span-12 xl:col-span-6"
      :label="SPELL_EFFECT_LABELS.scalingTargets"
      :help="SPELL_EFFECT_LABELS.scalingTargetsHint"
      name="effect.scaling.additionalTargets"
    >
      <UInputNumber
        v-model="scalingAdditionalTargets"
        :min="0"
      />
    </UFormField>

    <!-- Способ применения: перебивает вывод по типу атаки и дистанции -->
    <UFormField
      class="col-span-full md:col-span-12 xl:col-span-6"
      :label="SPELL_EFFECT_LABELS.deliveryType"
      name="effect.deliveryType"
    >
      <USelect
        v-model="model.deliveryType"
        :items="SPELL_DELIVERY_TYPE_OPTIONS"
        :placeholder="SPELL_EFFECT_LABELS.deliveryTypePlaceholder"
        clearable
      />
    </UFormField>

    <!-- Тип атаки -->
    <UFormField
      class="col-span-full md:col-span-12 xl:col-span-6"
      :label="SPELL_EFFECT_LABELS.attackType"
      name="effect.attackType"
    >
      <SelectAttackType v-model="model.attackType" />
    </UFormField>

    <UFormField
      v-if="showAttackBonus"
      class="col-span-full md:col-span-12 xl:col-span-6"
      :label="SPELL_EFFECT_LABELS.attackBonus"
      :help="SPELL_EFFECT_LABELS.attackBonusHint"
      name="effect.attackBonus"
    >
      <UInputNumber v-model="model.attackBonus" />
    </UFormField>

    <!-- Авто попадание -->
    <UFormField
      class="col-span-full md:col-span-12 xl:col-span-6"
      :label="SPELL_EFFECT_LABELS.autoHit"
      name="effect.autoHit"
    >
      <USwitch v-model="model.autoHit" />
    </UFormField>

    <p class="col-span-full text-xs text-dimmed">
      {{ SPELL_EFFECT_LABELS.deliveryTypeHint }}
    </p>

    <!-- Предупреждение при autoHit + attackType/savingThrows -->
    <UAlert
      v-if="showAutoHitWarning"
      class="col-span-full"
      color="warning"
      variant="subtle"
      :title="SPELL_EFFECT_LABELS.conflictTitle"
      :description="SPELL_EFFECT_LABELS.conflictDescription"
    />

    <!-- Область воздействия (только для AREA) -->
    <template v-if="showAreaOfEffect">
      <UFormField
        class="col-span-full md:col-span-12 xl:col-span-6"
        :label="SPELL_EFFECT_LABELS.areaOfEffect"
        name="effect.areaOfEffect.type"
      >
        <SelectSpellArea v-model="model.areaOfEffect!.type" />
      </UFormField>

      <UFormField
        class="col-span-full md:col-span-6 xl:col-span-3"
        :label="SPELL_EFFECT_LABELS.areaValue1"
        name="effect.areaOfEffect.value1"
      >
        <UInput
          v-model.number="model.areaOfEffect!.value1"
          type="number"
          :placeholder="SPELL_EFFECT_LABELS.areaValuePlaceholder"
        />
      </UFormField>

      <UFormField
        v-if="showValue2"
        class="col-span-full md:col-span-6 xl:col-span-3"
        :label="SPELL_EFFECT_LABELS.areaValue2"
        name="effect.areaOfEffect.value2"
      >
        <UInput
          v-model.number="model.areaOfEffect!.value2"
          type="number"
          :placeholder="SPELL_EFFECT_LABELS.areaValuePlaceholder"
        />
      </UFormField>
    </template>
  </div>
</template>
