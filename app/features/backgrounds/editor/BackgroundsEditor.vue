<script setup lang="ts">
  import type { BackgroundCreate } from '~backgrounds/model';

  import { BACKGROUND_EDITOR_LABELS } from '~backgrounds/model';
  import { BackgroundPreview } from '~backgrounds/preview';
  import { EditorBaseInfo, StartingEquipmentEditor } from '~ui/editor';
  import { MarkupEditor } from '~ui/markup-editor';
  import {
    SelectAbilities,
    SelectClass,
    SelectFeat,
    SelectSkill,
  } from '~ui/select';
  import { InfoTooltip } from '~ui/tooltip';
  import { useWorkshopForm } from '~workshop/composable';
  import { REVISION_ENTITY_TYPES } from '~workshop/revision/model';
  import { WorkshopEditorFormControls } from '~workshop/revision/ui';

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
      srdVersion: undefined,
      description: '',
      abilityScores: [],
      featUrl: undefined,
      featSuffix: undefined,
      skillsProficiencies: [],
      toolProficiency: '',
      equipment: '',
      startingEquipment: [],
      tags: [],
    };
  }

  const { state, submitState, onSubmit, onError, revisionControl } =
    useWorkshopForm<BackgroundCreate>({
      actionUrl: '/api/v2/backgrounds',
      getInitialState,
      revisionEntityType: REVISION_ENTITY_TYPES.BACKGROUND,
    });
</script>

<template>
  <UForm
    :state
    class="grid gap-8 pb-24"
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

      <div class="grid grid-cols-1 gap-4 md:grid-cols-24">
        <UFormField
          class="md:col-span-12 lg:col-span-8"
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
          class="md:col-span-12 lg:col-span-8"
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
          class="md:col-span-12 lg:col-span-4"
          label="Черта"
          name="featUrl"
        >
          <SelectFeat
            v-model="state.featUrl"
            :categories="['ORIGIN']"
          />
        </UFormField>

        <!-- Класс черты, а не свободный текст: лист персонажа сверяет подпись
          с каталогом классов и по ней сужает пул заклинаний «Посвящённого в
          магию» — с опечаткой или своим написанием сверка не сойдётся -->
        <UFormField
          class="md:col-span-12 lg:col-span-4"
          name="featSuffix"
        >
          <template #label>
            <InfoTooltip
              :text="BACKGROUND_EDITOR_LABELS.featClassHint"
              icon="tabler:info-circle-filled"
            >
              <span>{{ BACKGROUND_EDITOR_LABELS.featClass }}</span>
            </InfoTooltip>
          </template>

          <SelectClass
            v-model="state.featSuffix"
            name-as-value
          />
        </UFormField>

        <UFormField
          class="col-span-full"
          label="Владение инструментами"
          name="toolProficiency"
        >
          <MarkupEditor
            v-model="state.toolProficiency"
            placeholder="Введи инструменты"
          />
        </UFormField>

        <UFormField
          class="col-span-full"
          label="Снаряжение"
          name="equipment"
        >
          <MarkupEditor
            v-model="state.equipment"
            placeholder="Введи снаряжение"
          />
        </UFormField>
      </div>
    </UCard>

    <StartingEquipmentEditor v-model="state.startingEquipment" />

    <UCard variant="subtle">
      <template #header>
        <h2 class="truncate text-base text-highlighted">Описание</h2>
      </template>

      <div class="grid grid-cols-1 gap-4">
        <UFormField name="description">
          <MarkupEditor
            v-model="state.description"
            placeholder="Введи описание"
          />
        </UFormField>
      </div>
    </UCard>

    <WorkshopEditorFormControls :revision-control>
      <template #preview="{ opened, changeVisibility }">
        <BackgroundPreview
          :open="opened"
          :state="submitState"
          @update:open="changeVisibility"
        />
      </template>
    </WorkshopEditorFormControls>
  </UForm>
</template>
