<script setup lang="ts">
  import type { SpellEffectDamagePart } from '../../model';

  import {
    createEmptySpellEffectDamagePart,
    SPELL_EFFECT_DAMAGE_TARGET_OPTIONS,
    SPELL_EFFECT_DAMAGE_TYPE_OPTIONS,
  } from '../../model';

  const { addLabel = 'Добавить урон' } = defineProps<{
    addLabel?: string;
  }>();

  const model = defineModel<Array<SpellEffectDamagePart>>({
    default: () => [],
  });

  function addPart() {
    model.value = [...model.value, createEmptySpellEffectDamagePart()];
  }

  function removePart(index: number) {
    model.value = model.value.filter((_, position) => position !== index);
  }

  function isHealing(part: SpellEffectDamagePart): boolean {
    return part.formula.includes('@heal');
  }
</script>

<template>
  <div class="flex flex-col gap-2">
    <div
      v-for="(part, index) in model"
      :key="index"
      class="grid grid-cols-24 items-end gap-2 rounded-lg border border-default bg-elevated/50 p-3"
    >
      <UFormField
        label="Формула"
        class="col-span-full md:col-span-9"
      >
        <UInput
          v-model="part.formula"
          placeholder="Напр.: 2к8@dmg.poison"
          class="font-mono text-xs"
        />
      </UFormField>

      <UFormField
        label="Тип урона"
        class="col-span-full md:col-span-6"
      >
        <USelect
          v-model="part.type"
          :items="SPELL_EFFECT_DAMAGE_TYPE_OPTIONS"
          :disabled="isHealing(part)"
          placeholder="Тип"
          clearable
          class="w-full"
        />
      </UFormField>

      <UFormField
        label="Цель"
        class="col-span-full md:col-span-6"
      >
        <USelect
          v-model="part.target"
          :items="SPELL_EFFECT_DAMAGE_TARGET_OPTIONS"
          class="w-full"
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

      <UFormField class="col-span-full">
        <UCheckbox
          v-model="part.requiresDamage"
          label="Только если по цели нанесён урон"
        />
      </UFormField>
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
