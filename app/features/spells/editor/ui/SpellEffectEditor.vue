<script setup lang="ts">
  import type { SpellEffect } from '../../model';

  import {
    SelectAbilities,
    SelectAttackType,
    SelectCondition,
    SelectHealType,
    SelectSpellArea,
  } from '~ui/select';

  import {
    SPELL_SAVE_EFFECT_OPTIONS,
    SPELL_TARGET_TYPE_OPTIONS,
  } from '../../model';
  import SpellDamageFormulas from './SpellDamageFormulas.vue';

  const model = defineModel<SpellEffect>({ required: true });

  const damageFormulas = computed<Array<string>>({
    get: () => model.value.damageFormulas ?? [],
    set: (value) => {
      model.value = {
        ...model.value,
        damageFormulas: value,
      };
    },
  });

  const showTargetCount = computed(() => {
    const targetType = model.value.targetType;

    return targetType === 'CREATURE' || targetType === 'OBJECT';
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
        Воздействие заклинания
      </h2>
    </template>

    <div class="grid grid-cols-24 gap-4">
      <!-- Тип цели -->
      <UFormField
        class="col-span-full md:col-span-12 xl:col-span-6"
        label="Тип цели"
        name="effect.targetType"
      >
        <USelect
          v-model="model.targetType"
          :items="SPELL_TARGET_TYPE_OPTIONS"
          placeholder="Выбери тип цели"
          clearable
        />
      </UFormField>

      <!-- Количество целей (только для CREATURE и OBJECT) -->
      <UFormField
        v-if="showTargetCount"
        class="col-span-full md:col-span-12 xl:col-span-6"
        label="Количество целей"
        name="effect.targetCount"
      >
        <UInput
          v-model.number="model.targetCount"
          type="number"
          placeholder="Количество целей"
          :min="1"
        />
      </UFormField>

      <!-- Авто попадание -->
      <UFormField
        class="col-span-full md:col-span-12 xl:col-span-6"
        label="Авто попадание"
        name="effect.autoHit"
      >
        <USwitch
          v-model="model.autoHit"
          label="Авто попадание"
        />
      </UFormField>

      <!-- Тип атаки -->
      <UFormField
        class="col-span-full md:col-span-12 xl:col-span-6"
        label="Тип атаки"
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
        title="Конфликт настроек"
        description="При включённом авто попадании тип атаки и спасброски не должны быть заполнены."
      />

      <SpellDamageFormulas v-model="damageFormulas" />

      <!-- Типы лечения -->
      <UFormField
        class="col-span-full md:col-span-12 xl:col-span-6"
        label="Типы лечения"
        name="effect.healingTypes"
      >
        <SelectHealType
          v-model="model.healingTypes"
          multiple
        />
      </UFormField>

      <!-- Спасброски -->
      <UFormField
        class="col-span-full md:col-span-12 xl:col-span-6"
        label="Спасброски"
        name="effect.savingThrows"
      >
        <SelectAbilities
          v-model="model.savingThrows"
          multiple
        />
      </UFormField>

      <UFormField
        class="col-span-full md:col-span-12 xl:col-span-6"
        label="При успехе"
        name="effect.saveEffect"
      >
        <USelect
          v-model="model.saveEffect"
          :items="SPELL_SAVE_EFFECT_OPTIONS"
          placeholder="Выбери эффект"
          clearable
        />
      </UFormField>

      <!-- Состояния -->
      <UFormField
        class="col-span-full md:col-span-12 xl:col-span-6"
        label="Состояния"
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
          label="Область воздействия"
          name="effect.areaOfEffect.type"
        >
          <SelectSpellArea v-model="model.areaOfEffect!.type" />
        </UFormField>

        <UFormField
          class="col-span-full md:col-span-6 xl:col-span-3"
          label="Радиус/длина"
          name="effect.areaOfEffect.value1"
        >
          <UInput
            v-model.number="model.areaOfEffect!.value1"
            type="number"
            placeholder="Значение"
          />
        </UFormField>

        <UFormField
          v-if="showValue2"
          class="col-span-full md:col-span-6 xl:col-span-3"
          label="Высота/ширина"
          name="effect.areaOfEffect.value2"
        >
          <UInput
            v-model.number="model.areaOfEffect!.value2"
            type="number"
            placeholder="Значение"
          />
        </UFormField>
      </template>
    </div>
  </UCard>
</template>
