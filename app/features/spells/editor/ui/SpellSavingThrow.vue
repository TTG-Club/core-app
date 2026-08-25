<script setup lang="ts">
  import type { SpellEffect } from '../../model';

  import { SelectAbilities, SelectCondition } from '~ui/select';

  import { SPELL_EFFECT_LABELS, SPELL_SAVE_EFFECT_OPTIONS } from '../../model';

  const model = defineModel<SpellEffect>({ required: true });
</script>

<template>
  <div class="grid grid-cols-24 gap-4">
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
      :label="SPELL_EFFECT_LABELS.conditions"
      name="effect.conditions"
    >
      <SelectCondition
        v-model="model.conditions"
        multiple
      />
    </UFormField>
  </div>
</template>
