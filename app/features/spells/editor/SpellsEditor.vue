<script setup lang="ts">
  import {
    SpellCastingTimes,
    SpellRanges,
    SpellDurations,
    SpellComponents,
  } from './ui';

  import { EditorBaseInfo, EditorFormControls } from '~ui/editor';
  import {
    SelectAbilities,
    SelectDamageType,
    SelectHealType,
    SelectLevel,
    SelectMagicSchool,
    SelectSpecies,
  } from '~ui/select';

  import type { SpellCreate, SpellDetailResponse } from '~/shared/types';
  import { SpellPreview } from '~spells/preview';

  const formRef = useTemplateRef('formRef');

  const validate = () => {
    return formRef.value?.validate();
  };

  defineExpose({
    validate,
  });

  function getInitialState(): SpellCreate {
    return {
      url: '',
      name: {
        rus: '',
        eng: '',
        alt: [],
      },
      source: {
        url: undefined,
        page: undefined,
      },
      description: '',
      upper: undefined,
      level: 0,
      school: undefined,
      range: [],
      duration: [],
      castingTime: [],
      components: {
        v: false,
        s: false,
        m: undefined,
      },
      affiliations: {
        classes: [],
        subclasses: [],
        species: [],
        lineages: [],
      },
      tags: [],
      savingThrow: [],
      healingType: [],
      damageType: [],
    };
  }

  const { state, onError, onSubmit } = useWorkshopForm<SpellCreate>({
    actionUrl: '/api/v2/spells',
    getInitialState,
  });

  const {
    preview,
    isPreviewShowed,
    isPreviewLoading,
    isPreviewError,
    showPreview,
  } = useWorkshopPreview<SpellCreate, SpellDetailResponse>({
    actionUrl: '/api/v2/spells',
    state,
  });
</script>

<template>
  <UForm
    ref="formRef"
    :state
    class="grid grid-cols-24 gap-4"
    @error="onError"
    @submit="onSubmit"
  >
    <EditorBaseInfo
      v-model="state"
      section="spells"
    />

    <UFormField
      class="col-span-12"
      label="Уровень заклинания"
      name="level"
    >
      <SelectLevel v-model="state.level" />
    </UFormField>

    <UFormField
      class="col-span-12"
      label="Школа"
      name="school"
    >
      <SelectMagicSchool v-model="state.school" />
    </UFormField>

    <SpellCastingTimes v-model="state.castingTime" />

    <SpellRanges v-model="state.range" />

    <SpellComponents v-model="state.components" />

    <SpellDurations v-model="state.duration" />

    <USeparator>
      <span class="font-bold text-secondary">Дополнительные фильтры</span>
    </USeparator>

    <UFormField
      label="Типы урона"
      name="damageType"
      class="col-span-8"
    >
      <SelectDamageType
        v-model="state.damageType"
        multiple
      />
    </UFormField>

    <UFormField
      class="col-span-8"
      label="Спасброски"
      name="savingThrow"
    >
      <SelectAbilities
        v-model="state.savingThrow"
        multiple
      />
    </UFormField>

    <UFormField
      class="col-span-8"
      label="Типы лечения"
      name="healingType"
    >
      <SelectHealType
        v-model="state.healingType"
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
        v-model="state.description"
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
        v-model="state.upper"
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
        v-model="state.affiliations.classes"
        multiple
      />
    </UFormField>

    <UFormField
      class="col-span-6"
      label="Архетипы"
      name="affiliations.subclasses"
    >
      <SelectSpecies
        v-model="state.affiliations.subclasses"
        multiple
      />
    </UFormField>

    <UFormField
      class="col-span-6"
      label="Виды"
      name="affiliations.species"
    >
      <SelectSpecies
        v-model="state.affiliations.species"
        multiple
      />
    </UFormField>

    <UFormField
      class="col-span-6"
      label="Происхождения"
      name="affiliations.lineages"
    >
      <SelectSpecies
        v-model="state.affiliations.lineages"
        multiple
      />
    </UFormField>

    <EditorFormControls @preview="showPreview" />
  </UForm>

  <SpellPreview
    v-model="isPreviewShowed"
    :spell="preview"
    :is-loading="isPreviewLoading"
    :is-error="isPreviewError"
  />
</template>
