<script setup lang="ts">
  import type { SpellCreate } from '~spells/model';

  import {
    createEmptySpellEffect,
    normalizeLoadedSpell,
    normalizeSpellActiveEffects,
    normalizeSpellEffect,
  } from '~spells/model';
  import { SpellPreview } from '~spells/preview';
  import { EditorBaseInfo, EditorFormControls } from '~ui/editor';
  import { MarkupEditor } from '~ui/markup-editor';
  import {
    SelectClass,
    SelectFeat,
    SelectLineage,
    SelectMagicSchool,
    SelectSpecies,
    SelectSpellLevel,
    SelectSubclass,
  } from '~ui/select';
  import { useWorkshopForm } from '~workshop/composable';

  import {
    SpellActiveEffects,
    SpellCastingTimes,
    SpellComponents,
    SpellDurations,
    SpellEffectEditor,
    SpellRanges,
  } from './ui';

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
      srdVersion: undefined,
      description: '',
      upper: undefined,
      level: 0,
      school: {
        school: undefined,
        additionalType: undefined,
      },
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
        feats: [],
      },
      tags: [],
      effect: createEmptySpellEffect(),
      activeEffects: [],
    };
  }

  const { state, submitState, onError, onSubmit } =
    useWorkshopForm<SpellCreate>({
      actionUrl: '/api/v2/spells',
      getInitialState,
      normalizeLoaded: normalizeLoadedSpell,
      transformBeforeSubmit: (formState) => {
        const normalizedEffect = normalizeSpellEffect(formState.effect);

        return {
          ...formState,
          effect: normalizedEffect ?? createEmptySpellEffect(),
          activeEffects: normalizeSpellActiveEffects(formState.activeEffects),
        };
      },
    });
</script>

<template>
  <UForm
    ref="formRef"
    :state
    class="grid gap-8 pb-24"
    @error="onError"
    @submit="onSubmit"
  >
    <EditorBaseInfo
      v-model="state"
      section="spells"
    />

    <UCard variant="subtle">
      <template #header>
        <h2 class="truncate text-base text-highlighted">
          Характеристики заклинания
        </h2>
      </template>

      <div class="grid grid-cols-24 gap-4">
        <UFormField
          class="col-span-full md:col-span-12"
          label="Уровень заклинания"
          name="level"
        >
          <SelectSpellLevel v-model="state.level" />
        </UFormField>

        <UFormField
          class="col-span-full md:col-span-12"
          label="Школа"
          name="school"
        >
          <SelectMagicSchool v-model="state.school.school" />
        </UFormField>

        <UFormField
          class="col-span-full"
          label="Подшкола"
          name="additionalType"
        >
          <UInput
            v-model="state.school.additionalType"
            placeholder="Подшкола"
          />
        </UFormField>

        <SpellCastingTimes v-model="state.castingTime" />

        <SpellRanges v-model="state.range" />

        <SpellComponents v-model="state.components" />

        <SpellDurations v-model="state.duration" />
      </div>
    </UCard>

    <SpellEffectEditor
      v-model="state.effect"
      :level="state.level"
    />

    <SpellActiveEffects v-model="state.activeEffects" />

    <UCard variant="subtle">
      <template #header>
        <h2 class="truncate text-base text-highlighted">Описание</h2>
      </template>

      <div class="grid grid-cols-24 gap-4">
        <UFormField
          label="Описание"
          name="description"
          class="col-span-full lg:col-span-12"
        >
          <MarkupEditor
            v-model="state.description"
            placeholder="Введи описание"
          />
        </UFormField>

        <UFormField
          label="На более высоких уровнях"
          name="upper"
          class="col-span-full lg:col-span-12"
        >
          <MarkupEditor
            v-model="state.upper"
            placeholder="Введи описание"
          />
        </UFormField>
      </div>
    </UCard>

    <UCard variant="subtle">
      <template #header>
        <h2 class="truncate text-base text-highlighted">Принадлежность</h2>
      </template>

      <div class="grid grid-cols-24 gap-4">
        <UFormField
          label="Классы"
          name="affiliations.classes"
          class="col-span-full md:col-span-12 xl:col-span-6"
        >
          <SelectClass
            v-model="state.affiliations.classes"
            multiple
          />
        </UFormField>

        <UFormField
          class="col-span-full md:col-span-12 xl:col-span-6"
          label="Подклассы"
          name="affiliations.subclasses"
        >
          <SelectSubclass
            v-model="state.affiliations.subclasses"
            multiple
          />
        </UFormField>

        <UFormField
          class="col-span-full md:col-span-12 xl:col-span-6"
          label="Виды"
          name="affiliations.species"
        >
          <SelectSpecies
            v-model="state.affiliations.species"
            multiple
          />
        </UFormField>

        <UFormField
          class="col-span-full md:col-span-12 xl:col-span-6"
          label="Происхождения"
          name="affiliations.lineages"
        >
          <SelectLineage
            v-model="state.affiliations.lineages"
            multiple
          />
        </UFormField>

        <UFormField
          class="col-span-full md:col-span-12 xl:col-span-6"
          label="Черта"
          name="affiliations.feats"
        >
          <SelectFeat
            v-model="state.affiliations.feats"
            multiple
          />
        </UFormField>
      </div>
    </UCard>

    <EditorFormControls>
      <template #preview="{ opened, changeVisibility }">
        <SpellPreview
          :open="opened"
          :state="submitState"
          @update:open="changeVisibility"
        />
      </template>
    </EditorFormControls>
  </UForm>
</template>
