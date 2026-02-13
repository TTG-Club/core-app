<script setup lang="ts">
  import { BackgroundPreview } from '~backgrounds/preview';
  import { EditorBaseInfo, EditorFormControls } from '~ui/editor';
  import { SelectAbilities, SelectFeat, SelectSkill } from '~ui/select';
  import { useWorkshopForm } from '~workshop/composable';

  import type { BackgroundCreate } from '~backgrounds/model';

  function getInitialState(): BackgroundCreate {
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
      abilityScores: [],
      featUrl: undefined,
      skillsProficiencies: [],
      toolProficiency: '',
      equipment: '',
      tags: [],
    };
  }

  const { state, onSubmit, onError } = useWorkshopForm<BackgroundCreate>({
    actionUrl: '/api/v2/backgrounds',
    getInitialState,
  });
</script>

<template>
  <UForm
    :state
    class="grid gap-8"
    @submit="onSubmit"
    @error="onError"
  >
    <EditorBaseInfo
      v-model="state"
      section="backgrounds"
    />

    <UCard variant="subtle">
      <template #header>
        <h2 class="truncate text-base text-highlighted">Подробности</h2>
      </template>

      <div class="grid grid-cols-24 gap-4">
        <UFormField
          class="col-span-8"
          label="Характеристики"
          help="В предыстории перечислены 3 из ваших характеристик персонажа. Увеличьте одну из них на 2, а другую на 1; или увеличьте каждую из 3 на 1."
          name="abilityScores"
        >
          <SelectAbilities
            v-model="state.abilityScores"
            :limit="3"
            multiple
          />
        </UFormField>

        <UFormField
          class="col-span-8"
          label="Навыки"
          help="Предыстория даёт вашему персонажу владение двумя определёнными навыками."
          name="skillsProficiencies"
        >
          <SelectSkill
            v-model="state.skillsProficiencies"
            :limit="2"
            multiple
          />
        </UFormField>

        <UFormField
          class="col-span-8"
          label="Черта"
          name="featUrl"
        >
          <SelectFeat
            v-model="state.featUrl"
            :categories="['ORIGIN']"
          />
        </UFormField>

        <UFormField
          class="col-span-24"
          label="Владение инструментами"
          name="toolProficiency"
        >
          <UTextarea
            v-model="state.toolProficiency"
            :rows="3"
            placeholder="Введи инструменты"
          />
        </UFormField>

        <UFormField
          class="col-span-24"
          label="Снаряжение"
          name="equipment"
        >
          <UTextarea
            v-model="state.equipment"
            :rows="3"
            placeholder="Введи снаряжение"
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
          class="col-span-24"
          label="Описание"
          name="description"
        >
          <UTextarea
            v-model="state.description"
            :rows="8"
            placeholder="Введи описание"
          />
        </UFormField>
      </div>
    </UCard>

    <EditorFormControls>
      <template #preview="{ opened, changeVisibility }">
        <BackgroundPreview
          :open="opened"
          :state="state"
          @update:open="changeVisibility"
        />
      </template>
    </EditorFormControls>
  </UForm>
</template>
