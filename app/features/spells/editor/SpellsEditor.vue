<script setup lang="ts">
  import {
    SpellCastingTimes,
    SpellRanges,
    SpellDurations,
    SpellComponents,
  } from './ui';

  import { EditorBaseInfo } from '~ui/editor';
  import {
    SelectAbilities,
    SelectDamageType,
    SelectHealType,
    SelectLevel,
    SelectMagicSchool,
    SelectSpecies,
  } from '~ui/select';

  import type { SpellCreate } from '~/shared/types';

  const { isCreating } = defineProps<{
    isCreating: boolean;
  }>();

  const form = defineModel<SpellCreate>({ required: true });

  const formRef = useTemplateRef('formRef');

  const validate = () => {
    return formRef.value?.validate();
  };

  defineExpose({
    validate,
  });
</script>

<template>
  <UForm
    ref="formRef"
    :state="form"
    :disabled="isCreating"
    class="grid grid-cols-24 gap-4"
  >
    <EditorBaseInfo
      v-model="form"
      section="spells"
    />

    <UFormField
      class="col-span-12"
      label="Уровень заклинания"
      name="level"
    >
      <SelectLevel v-model="form.level" />
    </UFormField>

    <UFormField
      class="col-span-12"
      label="Школа"
      name="school"
    >
      <SelectMagicSchool v-model="form.school" />
    </UFormField>

    <SpellCastingTimes v-model="form.castingTime" />

    <SpellRanges v-model="form.range" />

    <SpellComponents v-model="form.components" />

    <SpellDurations v-model="form.duration" />

    <USeparator>
      <span class="font-bold text-secondary">Дополнительные фильтры</span>
    </USeparator>

    <UFormField
      label="Типы урона"
      name="damageType"
      class="col-span-8"
    >
      <SelectDamageType
        v-model="form.damageType"
        multiple
      />
    </UFormField>

    <UFormField
      class="col-span-8"
      label="Спасброски"
      name="savingThrow"
    >
      <SelectAbilities
        v-model="form.savingThrow"
        multiple
      />
    </UFormField>

    <UFormField
      class="col-span-8"
      label="Типы лечения"
      name="healingType"
    >
      <SelectHealType
        v-model="form.healingType"
        multiple
      />
    </UFormField>

    <USeparator>
      <span class="font-bold text-secondary">Описание</span>
    </USeparator>

    <UFormField
      label="Описание"
      name="description"
      class="col-span-12"
    >
      <UTextarea
        v-model="form.description"
        :rows="8"
        placeholder="Введи описание"
      />
    </UFormField>

    <UFormField
      label="На более высоких уровнях"
      name="upper"
      class="col-span-12"
    >
      <UTextarea
        v-model="form.upper"
        :rows="8"
        placeholder="Введи описание"
      />
    </UFormField>

    <USeparator>
      <span class="font-bold text-secondary">Принадлежность</span>
    </USeparator>

    <UFormField
      label="Классы"
      name="affiliations.classes"
      class="col-span-6"
    >
      <SelectSpecies
        v-model="form.affiliations.classes"
        multiple
      />
    </UFormField>

    <UFormField
      class="col-span-6"
      label="Архетипы"
      name="affiliations.subclasses"
    >
      <SelectSpecies
        v-model="form.affiliations.subclasses"
        multiple
      />
    </UFormField>

    <UFormField
      class="col-span-6"
      label="Виды"
      name="affiliations.species"
    >
      <SelectSpecies
        v-model="form.affiliations.species"
        multiple
      />
    </UFormField>

    <UFormField
      class="col-span-6"
      label="Происхождения"
      name="affiliations.lineages"
    >
      <SelectSpecies
        v-model="form.affiliations.lineages"
        multiple
      />
    </UFormField>
  </UForm>
</template>
