<script setup lang="ts">
  import type { SpellEffectChange } from '../../model';

  import {
    createEmptySpellEffectChange,
    SPELL_EFFECT_CHANGE_MODE_OPTIONS,
    SPELL_EFFECT_CONDITION_EXPR_SUGGESTIONS,
    SPELL_EFFECT_TARGET_KEY_SUGGESTIONS,
    SPELL_EFFECT_VALUE_SUGGESTIONS,
  } from '../../model';
  import SpellEffectLibraryInput from './SpellEffectLibraryInput.vue';

  const model = defineModel<Array<SpellEffectChange>>({ default: () => [] });

  function addChange() {
    model.value = [...model.value, createEmptySpellEffectChange()];
  }

  function removeChange(index: number) {
    model.value = model.value.filter((_, position) => position !== index);
  }
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-center justify-between">
      <span class="text-sm font-medium">Модификаторы (changes)</span>

      <UButton
        icon="tabler:plus"
        size="xs"
        variant="ghost"
        @click.left.exact.prevent="addChange"
      >
        Добавить
      </UButton>
    </div>

    <p
      v-if="!model.length"
      class="rounded-lg border border-dashed border-default p-4 text-center text-xs text-dimmed italic"
    >
      Нет числовых модификаторов.
    </p>

    <div
      v-for="(change, index) in model"
      :key="index"
      class="grid grid-cols-24 items-end gap-2 rounded-lg border border-default bg-elevated/50 p-3"
    >
      <UFormField
        label="Ключ атрибута"
        class="col-span-full md:col-span-8"
      >
        <SpellEffectLibraryInput
          v-model="change.key"
          :options="SPELL_EFFECT_TARGET_KEY_SUGGESTIONS"
          placeholder="Напр.: armorClass"
        />
      </UFormField>

      <UFormField
        label="Режим"
        class="col-span-full md:col-span-5"
      >
        <USelect
          v-model="change.mode"
          :items="SPELL_EFFECT_CHANGE_MODE_OPTIONS"
          class="w-full"
        />
      </UFormField>

      <UFormField
        label="Значение"
        class="col-span-full md:col-span-7"
      >
        <SpellEffectLibraryInput
          v-model="change.value"
          :options="SPELL_EFFECT_VALUE_SUGGESTIONS"
          placeholder="+2, 1к4, @mod.spell"
        />
      </UFormField>

      <UFormField
        label="Приоритет"
        class="col-span-12 md:col-span-3"
      >
        <UInputNumber
          v-model="change.priority"
          :min="0"
          :max="100"
        />
      </UFormField>

      <UFormField class="col-span-12 flex items-end md:col-span-1">
        <UButton
          icon="tabler:trash"
          color="error"
          variant="soft"
          @click.left.exact.prevent="removeChange(index)"
        />
      </UFormField>

      <UFormField
        label="Условие"
        class="col-span-full"
      >
        <SpellEffectLibraryInput
          v-model="change.condition"
          :options="SPELL_EFFECT_CONDITION_EXPR_SUGGESTIONS"
          placeholder="Напр.: roll.hasAdvantage === true"
        />
      </UFormField>
    </div>
  </div>
</template>
