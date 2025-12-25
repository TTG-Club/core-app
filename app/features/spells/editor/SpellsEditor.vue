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
    SelectSpellLevel,
    SelectMagicSchool,
    SelectSpecies,
    SelectLineage,
    SelectSubclass,
    SelectClass,
    SelectCondition,
  } from '~ui/select';

  import type { SpellCreate } from '~/shared/types';
  import { SpellPreview } from '~spells/preview';

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
      condition: [],
    };
  }

  const { state, onError, onSubmit } = useWorkshopForm<SpellCreate>({
    actionUrl: '/api/v2/spells',
    getInitialState,
  });
</script>

<template>
  <UForm
    ref="formRef"
    :state
    class="grid gap-8"
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
          class="col-span-12"
          label="Уровень заклинания"
          name="level"
        >
          <SelectSpellLevel v-model="state.level" />
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
      </div>
    </UCard>

    <UCard variant="subtle">
      <template #header>
        <h2 class="truncate text-base text-highlighted">
          Дополнительные фильтры
        </h2>
      </template>

      <div class="grid grid-cols-24 gap-4">
        <UFormField
          label="Типы урона"
          name="damageType"
          class="col-span-6"
        >
          <SelectDamageType
            v-model="state.damageType"
            multiple
          />
        </UFormField>

        <UFormField
          class="col-span-6"
          label="Спасброски"
          name="savingThrow"
        >
          <SelectAbilities
            v-model="state.savingThrow"
            multiple
          />
        </UFormField>

        <UFormField
          label="Состояния"
          name="condition"
          class="col-span-6"
        >
          <SelectCondition
            v-model="state.condition"
            multiple
          />
        </UFormField>

        <UFormField
          class="col-span-6"
          label="Типы лечения"
          name="healingType"
        >
          <SelectHealType
            v-model="state.healingType"
            multiple
          />
        </UFormField>
      </div>
    </UCard>

    <UCard variant="subtle">
      <template #header>
        <h2 class="truncate text-base text-highlighted">Описание</h2>
      </template>

      <div class="grid grid-cols-24 gap-4">
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
          class="col-span-6"
        >
          <SelectClass
            v-model="state.affiliations.classes"
            multiple
          />
        </UFormField>

        <UFormField
          class="col-span-6"
          label="Подклассы"
          name="affiliations.subclasses"
        >
          <SelectSubclass
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
          <SelectLineage
            v-model="state.affiliations.lineages"
            multiple
          />
        </UFormField>
      </div>
    </UCard>

    <EditorFormControls>
      <template #preview="{ opened, changeVisibility }">
        <SpellPreview
          :open="opened"
          :state="state"
          @update:open="changeVisibility"
        />
      </template>
    </EditorFormControls>
  </UForm>
</template>
