<script setup lang="ts">
  import type { TabsItem } from '@nuxt/ui';

  import type { SpellCreate } from '~spells/model';

  import { ActiveEffects } from '~active-effects/editor';
  import { normalizeActiveEffects } from '~active-effects/model';
  import {
    createEmptySpellEffect,
    normalizeLoadedSpell,
    normalizeSpellEffect,
    SPELL_AFFILIATION_LABELS,
    SPELL_EDITOR_SECTIONS,
    SPELL_EDITOR_TABS,
    SPELL_MAIN_TAB_LABELS,
  } from '~spells/model';
  import { SpellPreview } from '~spells/preview';
  import { EditorBaseInfo } from '~ui/editor';
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
  import { REVISION_ENTITY_TYPES } from '~workshop/revision/model';
  import { WorkshopEditorFormControls } from '~workshop/revision/ui';

  import {
    SpellCastingTimes,
    SpellComponents,
    SpellDurations,
    SpellEffectEditor,
    SpellRanges,
    SpellUses,
  } from './ui';

  /**
   * Вкладки формы: чем заклинание является → как применяется → что делает в
   * бою → что оставляет после себя. Тот же порядок, что и в форме системы.
   */
  const tabItems: Array<TabsItem> = [
    { label: SPELL_EDITOR_TABS.main, slot: 'main' },
    { label: SPELL_EDITOR_TABS.usage, slot: 'usage' },
    { label: SPELL_EDITOR_TABS.combat, slot: 'combat' },
    { label: SPELL_EDITOR_TABS.effects, slot: 'effects' },
  ];

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

  const { state, submitState, onError, onSubmit, revisionControl } =
    useWorkshopForm<SpellCreate>({
      actionUrl: '/api/v2/spells',
      getInitialState,
      revisionEntityType: REVISION_ENTITY_TYPES.SPELL,
      normalizeLoaded: normalizeLoadedSpell,
      transformBeforeSubmit: (formState) => {
        const normalizedEffect = normalizeSpellEffect(formState.effect);

        return {
          ...formState,
          effect: normalizedEffect ?? createEmptySpellEffect(),
          activeEffects: normalizeActiveEffects(formState.activeEffects),
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
    <!-- Основная информация стоит над вкладками: название и источник нужны на
      любой из них, а её вложенная форма со схемой обязана быть смонтирована в
      момент сохранения -->
    <EditorBaseInfo
      v-model="state"
      section="spells"
    />

    <!-- Вкладки не размонтируются: поля скрытых вкладок остаются в форме, и
      сохранение видит их наравне с открытой -->
    <UTabs
      :items="tabItems"
      variant="pill"
      :unmount-on-hide="false"
      :ui="{ list: 'mb-6' }"
    >
      <!-- ОСНОВНОЕ -->
      <template #main>
        <div class="grid gap-8">
          <UCard variant="subtle">
            <template #header>
              <h2 class="truncate text-base text-highlighted">
                {{ SPELL_EDITOR_SECTIONS.basics }}
              </h2>
            </template>

            <div class="grid grid-cols-24 gap-4">
              <UFormField
                class="col-span-full md:col-span-12"
                :label="SPELL_MAIN_TAB_LABELS.level"
                name="level"
              >
                <SelectSpellLevel v-model="state.level" />
              </UFormField>

              <UFormField
                class="col-span-full md:col-span-12"
                :label="SPELL_MAIN_TAB_LABELS.school"
                name="school"
              >
                <SelectMagicSchool v-model="state.school.school" />
              </UFormField>

              <UFormField
                class="col-span-full"
                :label="SPELL_MAIN_TAB_LABELS.additionalType"
                name="additionalType"
              >
                <UInput
                  v-model="state.school.additionalType"
                  :placeholder="SPELL_MAIN_TAB_LABELS.additionalTypePlaceholder"
                />
              </UFormField>
            </div>
          </UCard>

          <UCard variant="subtle">
            <template #header>
              <h2 class="truncate text-base text-highlighted">
                {{ SPELL_EDITOR_SECTIONS.description }}
              </h2>
            </template>

            <div class="grid grid-cols-24 gap-4">
              <UFormField
                class="col-span-full"
                :label="SPELL_MAIN_TAB_LABELS.description"
                name="description"
              >
                <MarkupEditor
                  v-model="state.description"
                  :placeholder="SPELL_MAIN_TAB_LABELS.descriptionPlaceholder"
                />
              </UFormField>

              <UFormField
                class="col-span-full"
                :label="SPELL_MAIN_TAB_LABELS.upper"
                name="upper"
              >
                <MarkupEditor
                  v-model="state.upper"
                  :placeholder="SPELL_MAIN_TAB_LABELS.descriptionPlaceholder"
                />
              </UFormField>
            </div>
          </UCard>

          <UCard variant="subtle">
            <template #header>
              <h2 class="truncate text-base text-highlighted">
                {{ SPELL_EDITOR_SECTIONS.affiliations }}
              </h2>
            </template>

            <div class="grid grid-cols-24 gap-4">
              <UFormField
                class="col-span-full md:col-span-12 xl:col-span-6"
                :label="SPELL_AFFILIATION_LABELS.classes"
                name="affiliations.classes"
              >
                <SelectClass
                  v-model="state.affiliations.classes"
                  multiple
                />
              </UFormField>

              <UFormField
                class="col-span-full md:col-span-12 xl:col-span-6"
                :label="SPELL_AFFILIATION_LABELS.subclasses"
                name="affiliations.subclasses"
              >
                <SelectSubclass
                  v-model="state.affiliations.subclasses"
                  multiple
                />
              </UFormField>

              <UFormField
                class="col-span-full md:col-span-12 xl:col-span-6"
                :label="SPELL_AFFILIATION_LABELS.species"
                name="affiliations.species"
              >
                <SelectSpecies
                  v-model="state.affiliations.species"
                  multiple
                />
              </UFormField>

              <UFormField
                class="col-span-full md:col-span-12 xl:col-span-6"
                :label="SPELL_AFFILIATION_LABELS.lineages"
                name="affiliations.lineages"
              >
                <SelectLineage
                  v-model="state.affiliations.lineages"
                  multiple
                />
              </UFormField>

              <UFormField
                class="col-span-full md:col-span-12 xl:col-span-6"
                :label="SPELL_AFFILIATION_LABELS.feats"
                name="affiliations.feats"
              >
                <SelectFeat
                  v-model="state.affiliations.feats"
                  multiple
                />
              </UFormField>
            </div>
          </UCard>
        </div>
      </template>

      <!-- ПРИМЕНЕНИЕ -->
      <template #usage>
        <div class="grid gap-8">
          <UCard variant="subtle">
            <template #header>
              <h2 class="truncate text-base text-highlighted">
                {{ SPELL_EDITOR_SECTIONS.castingTime }}
              </h2>
            </template>

            <div class="grid grid-cols-24 gap-4">
              <SpellCastingTimes v-model="state.castingTime" />
            </div>
          </UCard>

          <UCard variant="subtle">
            <template #header>
              <h2 class="truncate text-base text-highlighted">
                {{ SPELL_EDITOR_SECTIONS.range }}
              </h2>
            </template>

            <div class="grid grid-cols-24 gap-4">
              <SpellRanges v-model="state.range" />
            </div>
          </UCard>

          <UCard variant="subtle">
            <template #header>
              <div class="flex min-w-0 flex-col">
                <h2 class="truncate text-base text-highlighted">
                  {{ SPELL_EDITOR_SECTIONS.components }}
                </h2>

                <span class="text-xs text-muted">
                  {{ SPELL_EDITOR_SECTIONS.componentsHint }}
                </span>
              </div>
            </template>

            <div class="grid grid-cols-24 gap-4">
              <SpellComponents v-model="state.components" />
            </div>
          </UCard>

          <UCard variant="subtle">
            <template #header>
              <h2 class="truncate text-base text-highlighted">
                {{ SPELL_EDITOR_SECTIONS.duration }}
              </h2>
            </template>

            <div class="grid grid-cols-24 gap-4">
              <SpellDurations v-model="state.duration" />
            </div>
          </UCard>

          <UCard variant="subtle">
            <template #header>
              <div class="flex min-w-0 flex-col">
                <h2 class="truncate text-base text-highlighted">
                  {{ SPELL_EDITOR_SECTIONS.uses }}
                </h2>

                <span class="text-xs text-muted">
                  {{ SPELL_EDITOR_SECTIONS.usesHint }}
                </span>
              </div>
            </template>

            <SpellUses v-model="state.effect.uses" />
          </UCard>
        </div>
      </template>

      <!-- БОЙ -->
      <template #combat>
        <SpellEffectEditor
          v-model="state.effect"
          :level="state.level"
        />
      </template>

      <!-- ЭФФЕКТЫ -->
      <template #effects>
        <ActiveEffects v-model="state.activeEffects" />
      </template>
    </UTabs>

    <WorkshopEditorFormControls :revision-control>
      <template #preview="{ opened, changeVisibility }">
        <SpellPreview
          :open="opened"
          :state="submitState"
          @update:open="changeVisibility"
        />
      </template>
    </WorkshopEditorFormControls>
  </UForm>
</template>
