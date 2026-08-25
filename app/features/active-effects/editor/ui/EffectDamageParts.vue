<script setup lang="ts">
  import type { EffectDamagePart } from '../../model';

  import { DamageFormulaInput } from '~ui/damage-formula';

  import {
    createEmptyEffectDamagePart,
    EFFECT_DAMAGE_TARGET_OPTIONS,
    EFFECT_DAMAGE_TYPE_OPTIONS,
  } from '../../model';

  const { addLabel = 'Добавить урон' } = defineProps<{
    addLabel?: string;
  }>();

  const model = defineModel<Array<EffectDamagePart>>({
    default: () => [],
  });

  /** Типы урона токенами формулы: `@dmg.fire` вместо отдельного поля. */
  const damageTypeTags = computed(() =>
    EFFECT_DAMAGE_TYPE_OPTIONS.map((damageType) => ({
      label: damageType.label,
      value: `dmg.${damageType.value}`,
    })),
  );

  function addPart() {
    model.value = [...model.value, createEmptyEffectDamagePart()];
  }

  function removePart(index: number) {
    model.value = model.value.filter((_, position) => position !== index);
  }

  function updateFormula(index: number, formula: string) {
    model.value = model.value.map((part, position) =>
      position === index ? { ...part, formula } : part,
    );
  }
</script>

<template>
  <div class="flex flex-col gap-2">
    <div
      v-for="(part, index) in model"
      :key="index"
      class="flex flex-col gap-3 rounded-lg border border-default bg-elevated/50 p-3"
    >
      <!-- Модификаторы и лечение спрятаны, как в редакторе эффектов VTTG:
        нагрузка эффекта считается без характеристики носителя и не лечит -->
      <DamageFormulaInput
        :model-value="part.formula"
        :damage-type-options="damageTypeTags"
        hide-modifiers
        hide-healing
        @update:model-value="updateFormula(index, $event)"
      />

      <div class="grid grid-cols-24 items-end gap-2">
        <UFormField
          label="Цель"
          class="col-span-full md:col-span-9"
        >
          <USelect
            v-model="part.target"
            :items="EFFECT_DAMAGE_TARGET_OPTIONS"
            class="w-full"
          />
        </UFormField>

        <UFormField class="col-span-full flex items-center md:col-span-12">
          <UCheckbox
            v-model="part.requiresDamage"
            label="Только если по цели нанесён урон"
          />
        </UFormField>

        <UFormField class="col-span-full flex items-end md:col-span-3">
          <UButton
            icon="tabler:trash"
            color="error"
            variant="soft"
            @click.left.exact.prevent="removePart(index)"
          />
        </UFormField>
      </div>
    </div>

    <UButton
      icon="tabler:plus"
      size="xs"
      variant="subtle"
      class="self-start"
      @click.left.exact.prevent="addPart"
    >
      {{ addLabel }}
    </UButton>
  </div>
</template>
