<script setup lang="ts">
  import type { CreateAction } from '../../../model';

  import { ActiveEffects } from '~active-effects/editor';
  import { EFFECT_ORIGIN } from '~active-effects/model';
  import { MarkupEditor } from '~ui/markup-editor';
  import { SelectRecharge } from '~ui/select';

  import {
    CREATURE_ACTION_LABELS,
    CREATURE_ACTION_SECTIONS,
  } from '../../constants';
  import CreatureActionCombat from './CreatureActionCombat.vue';

  /**
   * Поля записи боевого блока: действия, реакции, умения, эффекта логова.
   *
   * Своей формы у записи нет — ей владеет строка списка, которая живёт и со
   * свёрнутыми полями. Поэтому имена полей здесь относительные: путь записи
   * (`actions.0`) вложенная форма подставляет сама.
   */
  const model = defineModel<CreateAction>({ required: true });
</script>

<template>
  <UFormField
    class="col-span-full md:col-span-8"
    :label="CREATURE_ACTION_LABELS.nameRus"
    name="name.rus"
  >
    <UInput
      v-model="model.name.rus"
      :placeholder="CREATURE_ACTION_LABELS.nameRusPlaceholder"
    />
  </UFormField>

  <UFormField
    class="col-span-full md:col-span-8"
    :label="CREATURE_ACTION_LABELS.nameEng"
    name="name.eng"
  >
    <UInput
      v-model="model.name.eng"
      :placeholder="CREATURE_ACTION_LABELS.nameEngPlaceholder"
    />
  </UFormField>

  <UFormField
    class="col-span-full md:col-span-8"
    :label="CREATURE_ACTION_LABELS.recharge"
    name="recharge"
  >
    <SelectRecharge v-model="model.recharge" />
  </UFormField>

  <UFormField
    class="col-span-full"
    :label="CREATURE_ACTION_LABELS.description"
    name="description"
    :ui="{ root: 'w-full', container: 'w-full' }"
  >
    <MarkupEditor
      v-model="model.description"
      :placeholder="CREATURE_ACTION_LABELS.descriptionPlaceholder"
    />
  </UFormField>

  <UFormField
    class="col-span-full"
    name="effect.damageParts"
    :ui="{ root: 'w-full', container: 'w-full' }"
  >
    <CreatureActionCombat
      v-model="model.effect"
      field-name-prefix="effect"
    />
  </UFormField>

  <ActiveEffects
    v-model="model.effect.activeEffects"
    nested
    default-target="target"
    :origin="EFFECT_ORIGIN.feature"
    :title="CREATURE_ACTION_SECTIONS.effects"
  />
</template>
