<script setup lang="ts">
  import type { TabsItem } from '@nuxt/ui';

  import type { FeatCreate } from '../model';

  import { EditorBaseInfo } from '~ui/editor';
  import { MarkupEditor } from '~ui/markup-editor';
  import { SelectFeatCategory } from '~ui/select';
  import { InfoTooltip } from '~ui/tooltip';
  import { useWorkshopForm } from '~workshop/composable';
  import { REVISION_ENTITY_TYPES } from '~workshop/revision/model';
  import { WorkshopEditorFormControls } from '~workshop/revision/ui';

  import {
    createFeatEditorRows,
    createFeatMechanics,
    createPrerequisiteDetails,
    FEAT_EDITOR_LABELS,
    FEAT_EDITOR_TABS,
    FEAT_MAIN_TAB_LABELS,
    normalizeLoadedFeat,
    transformFeatBeforeSubmit,
  } from '../model';
  import { FeatPreview } from '../preview';
  import {
    FeatCounterRows,
    FeatGrantedSpells,
    FeatGrantRows,
    FeatModifierRows,
    FeatPrerequisiteRows,
    FeatSpellcastingAbility,
    FeatSpellChoices,
    FeatSpellListSpells,
  } from './ui';

  const formRef = useTemplateRef('formRef');

  defineExpose({
    submit: () => formRef.value!.submit(),
  });

  /**
   * Пустая черта, с которой открывается форма создания. Механика и строки
   * редактора здесь всегда объекты: загрузка сливает ответ сервера именно с
   * этим состоянием, и недостающие блоки берутся отсюда.
   *
   * @returns начальное состояние формы.
   */
  function getInitialState(): FeatCreate {
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
      prerequisite: '',
      prerequisiteDetails: createPrerequisiteDetails(),
      description: '',
      category: undefined,
      repeatability: false,
      abilities: [],
      mechanics: createFeatMechanics(),
      editorRows: createFeatEditorRows(),
      tags: [],
    };
  }

  const { state, submitState, onSubmit, onError, revisionControl } =
    useWorkshopForm<FeatCreate>({
      actionUrl: '/api/v2/feats',
      getInitialState,
      revisionEntityType: REVISION_ENTITY_TYPES.FEAT,
      normalizeLoaded: normalizeLoadedFeat,
      transformBeforeSubmit: transformFeatBeforeSubmit,
    });

  /**
   * Начальное состояние всегда содержит механику и строки редактора, но в типе
   * они необязательны: перед отправкой механика пересобирается из строк, а сами
   * строки из тела запроса выбрасываются. Эти обёртки дают шаблону непустые
   * объекты.
   */
  const mechanics = computed({
    get: () => state.value.mechanics ?? createFeatMechanics(),
    set: (value) => {
      state.value.mechanics = value;
    },
  });

  const editorRows = computed({
    get: () => state.value.editorRows ?? createFeatEditorRows(),
    set: (value) => {
      state.value.editorRows = value;
    },
  });

  const tabItems: Array<TabsItem> = [
    { label: FEAT_EDITOR_TABS.main, slot: 'main' },
    { label: FEAT_EDITOR_TABS.grants, slot: 'grants' },
    { label: FEAT_EDITOR_TABS.spells, slot: 'spells' },
    { label: FEAT_EDITOR_TABS.automation, slot: 'automation' },
    { label: FEAT_EDITOR_TABS.prerequisites, slot: 'prerequisites' },
  ];
</script>

<template>
  <UForm
    ref="formRef"
    :state
    class="grid gap-8"
    @submit="onSubmit"
    @error="onError"
  >
    <!-- Основная информация стоит над вкладками: название и источник нужны на
      любой из них, а её вложенная форма со схемой обязана быть смонтирована в
      момент сохранения -->
    <EditorBaseInfo
      v-model="state"
      section="feats"
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
                {{ FEAT_MAIN_TAB_LABELS.detailsTitle }}
              </h2>
            </template>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-24">
              <UFormField
                class="md:col-span-12"
                :label="FEAT_MAIN_TAB_LABELS.category"
                name="category"
              >
                <SelectFeatCategory v-model="state.category" />
              </UFormField>

              <UFormField
                class="md:col-span-12"
                :label="FEAT_MAIN_TAB_LABELS.repeatability"
                name="repeatability"
              >
                <UCheckbox
                  v-model="state.repeatability"
                  :label="FEAT_MAIN_TAB_LABELS.repeatabilityCheckbox"
                />
              </UFormField>
            </div>
          </UCard>

          <UCard variant="subtle">
            <template #header>
              <h2 class="truncate text-base text-highlighted">
                {{ FEAT_MAIN_TAB_LABELS.descriptionTitle }}
              </h2>
            </template>

            <UFormField
              :label="FEAT_MAIN_TAB_LABELS.description"
              name="description"
            >
              <MarkupEditor
                v-model="state.description"
                :placeholder="FEAT_MAIN_TAB_LABELS.descriptionPlaceholder"
              />
            </UFormField>
          </UCard>
        </div>
      </template>

      <!-- ВЛАДЕНИЯ -->
      <template #grants>
        <UCard variant="subtle">
          <template #header>
            <h2 class="truncate text-base text-highlighted">
              {{ FEAT_EDITOR_TABS.grants }}
            </h2>
          </template>

          <FeatGrantRows
            v-model="editorRows.grants"
            :rows="editorRows"
          />
        </UCard>
      </template>

      <!-- ЗАКЛИНАНИЯ -->
      <template #spells>
        <div class="grid gap-8">
          <UCard variant="subtle">
            <template #header>
              <h2 class="truncate text-base text-highlighted">
                {{ FEAT_EDITOR_LABELS.grantedSpellsTitle }}
              </h2>
            </template>

            <FeatGrantedSpells v-model="mechanics.spells" />
          </UCard>

          <UCard variant="subtle">
            <template #header>
              <h2 class="truncate text-base text-highlighted">
                {{ FEAT_EDITOR_LABELS.spellChoicesTitle }}
              </h2>
            </template>

            <FeatSpellChoices
              v-model="editorRows.spellChoice"
              :rows="editorRows"
            />
          </UCard>

          <UCard variant="subtle">
            <template #header>
              <h2 class="truncate text-base text-highlighted">
                {{ FEAT_EDITOR_LABELS.spellcastingAbilityTitle }}
              </h2>
            </template>

            <FeatSpellcastingAbility v-model="editorRows.spellChoice" />
          </UCard>

          <UCard variant="subtle">
            <template #header>
              <h2 class="truncate text-base text-highlighted">
                {{ FEAT_EDITOR_LABELS.spellListTitle }}
              </h2>
            </template>

            <FeatSpellListSpells v-model="mechanics.spellList" />
          </UCard>
        </div>
      </template>

      <!-- АВТОМАТИЗАЦИЯ -->
      <template #automation>
        <div class="grid gap-8">
          <UCard variant="subtle">
            <template #header>
              <h2 class="truncate text-base text-highlighted">
                {{ FEAT_EDITOR_LABELS.modifiersTitle }}
              </h2>
            </template>

            <FeatModifierRows
              v-model="editorRows.modifiers"
              :rows="editorRows"
            />
          </UCard>

          <UCard variant="subtle">
            <template #header>
              <h2 class="truncate text-base text-highlighted">
                {{ FEAT_EDITOR_LABELS.countersTitle }}
              </h2>
            </template>

            <FeatCounterRows v-model="editorRows.counters" />
          </UCard>
        </div>
      </template>

      <!-- ТРЕБОВАНИЯ -->
      <template #prerequisites>
        <div class="grid gap-8">
          <UCard variant="subtle">
            <template #header>
              <h2 class="truncate text-base text-highlighted">
                {{ FEAT_EDITOR_TABS.prerequisites }}
              </h2>
            </template>

            <FeatPrerequisiteRows v-model="editorRows.prerequisites" />
          </UCard>

          <!-- Условие строкой: карточка черты показывает его, только пока
            строки требований выше не заполнены -->
          <UCard variant="subtle">
            <template #header>
              <InfoTooltip
                :text="FEAT_EDITOR_LABELS.prerequisiteTextHint"
                icon="tabler:info-circle-filled"
                class="text-base text-highlighted"
              >
                <h2 class="truncate">
                  {{ FEAT_EDITOR_LABELS.prerequisiteLegacyTitle }}
                </h2>
              </InfoTooltip>
            </template>

            <UFormField name="prerequisite">
              <UInput
                v-model="state.prerequisite"
                :placeholder="FEAT_EDITOR_LABELS.prerequisiteLegacyPlaceholder"
              />
            </UFormField>
          </UCard>
        </div>
      </template>
    </UTabs>

    <WorkshopEditorFormControls :revision-control>
      <template #preview="{ opened, changeVisibility }">
        <FeatPreview
          :open="opened"
          :state="submitState"
          @update:open="changeVisibility"
        />
      </template>
    </WorkshopEditorFormControls>
  </UForm>
</template>
