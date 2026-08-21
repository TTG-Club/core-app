<script setup lang="ts">
  import type { SpellDamageFormulaPart, SpellEffect } from '../../model';

  import {
    SelectAbilities,
    SelectAttackType,
    SelectCondition,
    SelectSpellArea,
  } from '~ui/select';

  import {
    applySpellDamageFormulaParts,
    getSpellDamageFormulaParts,
    SPELL_EFFECT_LABELS,
    SPELL_PROJECTILE_HINTS,
    SPELL_SAVE_EFFECT_OPTIONS,
    SPELL_TARGET_COUNT_MIN,
    SPELL_TARGET_TYPE_OPTIONS,
  } from '../../model';
  import SpellDamageFormulas from './SpellDamageFormulas.vue';
  import SpellProjectiles from './SpellProjectiles.vue';

  const { level } = defineProps<{
    level: number; // круг заклинания (нужен снарядному режиму)
  }>();

  const model = defineModel<SpellEffect>({ required: true });

  // Формулы и их цели хранятся двумя параллельными массивами, но редактируются
  // как один список частей — иначе два отдельных обновления модели разъезжаются
  // по индексам.
  const damageFormulaParts = computed<Array<SpellDamageFormulaPart>>({
    get: () => getSpellDamageFormulaParts(model.value),
    set: (value) => {
      model.value = applySpellDamageFormulaParts(model.value, value);
    },
  });

  const showTargetCount = computed(() => {
    // У снарядных заклинаний число целей задаёт снарядный режим.
    if (model.value.projectiles) {
      return false;
    }

    const targetType = model.value.targetType;

    return targetType === 'CREATURE' || targetType === 'OBJECT';
  });

  // Нужен ли бросок атаки на каждый снаряд — выводится из «Тип атаки»/«Авто
  // попадание», поэтому противоречивую комбинацию задать нельзя.
  const projectileHint = computed(() => {
    if (model.value.autoHit) {
      return SPELL_PROJECTILE_HINTS.autoHit;
    }

    if (model.value.attackType) {
      return SPELL_PROJECTILE_HINTS.attackRoll;
    }

    return SPELL_PROJECTILE_HINTS.distributed;
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
  <UCard variant="subtle">
    <template #header>
      <h2 class="truncate text-base text-highlighted">
        {{ SPELL_EFFECT_LABELS.title }}
      </h2>
    </template>

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

      <!-- Авто попадание -->
      <UFormField
        class="col-span-full md:col-span-12 xl:col-span-6"
        :label="SPELL_EFFECT_LABELS.autoHit"
        name="effect.autoHit"
      >
        <USwitch
          v-model="model.autoHit"
          :label="SPELL_EFFECT_LABELS.autoHit"
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

      <!-- Предупреждение при autoHit + attackType/savingThrows -->
      <UAlert
        v-if="showAutoHitWarning"
        class="col-span-full"
        color="warning"
        variant="subtle"
        :title="SPELL_EFFECT_LABELS.conflictTitle"
        :description="SPELL_EFFECT_LABELS.conflictDescription"
      />

      <SpellProjectiles
        v-model="model.projectiles"
        :level="level"
        :hint="projectileHint"
      />

      <SpellDamageFormulas v-model="damageFormulaParts" />

      <!-- Спасброски -->
      <UFormField
        class="col-span-full md:col-span-12 xl:col-span-6"
        :label="SPELL_EFFECT_LABELS.savingThrows"
        name="effect.savingThrows"
      >
        <SelectAbilities
          v-model="model.savingThrows"
          multiple
        />
      </UFormField>

      <!-- Обычно характеристику даёт заклинатель, а не заклинание: поле нужно
        хоумбрю и заклинаниям, у которых она своя независимо от класса -->
      <UFormField
        class="col-span-full md:col-span-12 xl:col-span-6"
        :label="SPELL_EFFECT_LABELS.spellcastingAbility"
        :hint="SPELL_EFFECT_LABELS.spellcastingAbilityHint"
        name="effect.spellcastingAbility"
      >
        <SelectAbilities
          v-model="model.spellcastingAbility"
          :placeholder="SPELL_EFFECT_LABELS.spellcastingAbilityPlaceholder"
        />
      </UFormField>

      <UFormField
        class="col-span-full md:col-span-12 xl:col-span-6"
        :label="SPELL_EFFECT_LABELS.saveEffect"
        name="effect.saveEffect"
      >
        <USelect
          v-model="model.saveEffect"
          :items="SPELL_SAVE_EFFECT_OPTIONS"
          :placeholder="SPELL_EFFECT_LABELS.saveEffectPlaceholder"
          clearable
        />
      </UFormField>

      <!-- Состояния -->
      <UFormField
        class="col-span-full md:col-span-12 xl:col-span-6"
        :label="SPELL_EFFECT_LABELS.conditions"
        name="effect.conditions"
      >
        <SelectCondition
          v-model="model.conditions"
          multiple
        />
      </UFormField>

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
  </UCard>
</template>
