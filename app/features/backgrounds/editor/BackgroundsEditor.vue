<script setup lang="ts">
  import type { TabsItem } from '@nuxt/ui';

  import type { BackgroundCreate } from '../model';

  import { ActiveEffects } from '~active-effects/editor';
  import { EFFECT_ORIGIN } from '~active-effects/model';
  import {
    FeatEntityRefRows,
    FeatGrantedSpells,
    FeatGrantRows,
    FeatSpellcastingAbility,
    FeatSpellChoices,
    FeatSpellListSpells,
  } from '~feats/editor/ui';
  import {
    createFeatEditorRows,
    createFeatMechanics,
    ORIGIN_FEAT_CATEGORIES,
  } from '~feats/model';
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

  import {
    BACKGROUND_EDITOR_LABELS,
    BACKGROUND_EDITOR_TABS,
    BACKGROUND_GRANTS_TAB_LABELS,
    BACKGROUND_MAIN_TAB_LABELS,
    BACKGROUND_PARAMS_TAB_LABELS,
    createBackgroundToolChoice,
    normalizeLoadedBackground,
    transformBackgroundBeforeSubmit,
  } from '../model';
  import { BackgroundPreview } from '../preview';
  import { BackgroundToolGrant } from './ui';

  /**
   * Пустая предыстория, с которой открывается форма создания. Дары и строки
   * редактора здесь всегда объекты: загрузка сливает ответ сервера именно с
   * этим состоянием, и недостающие блоки берутся отсюда.
   *
   * @returns начальное состояние формы.
   */
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
      featChoices: [],
      skillsProficiencies: [],
      toolProficiency: '',
      toolProficiencies: [],
      toolChoice: createBackgroundToolChoice(),
      equipment: '',
      startingEquipment: [],
      mechanics: createFeatMechanics(),
      activeEffects: [],
      editorRows: createFeatEditorRows(),
      tags: [],
    };
  }

  const { state, submitState, onSubmit, onError, revisionControl } =
    useWorkshopForm<BackgroundCreate>({
      actionUrl: '/api/v2/backgrounds',
      getInitialState,
      revisionEntityType: REVISION_ENTITY_TYPES.BACKGROUND,
      normalizeLoaded: normalizeLoadedBackground,
      transformBeforeSubmit: transformBackgroundBeforeSubmit,
    });

  /**
   * Начальное состояние всегда содержит дары, строки редактора и блок выбора
   * инструментов, но в типе они необязательны: перед отправкой дары
   * пересобираются из строк, строки выбрасываются, а пустой выбор не пишется.
   * Эти обёртки дают шаблону непустые объекты.
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

  const toolChoice = computed({
    get: () => state.value.toolChoice ?? createBackgroundToolChoice(),
    set: (value) => {
      state.value.toolChoice = value;
    },
  });

  const tabItems: Array<TabsItem> = [
    { label: BACKGROUND_EDITOR_TABS.main, slot: 'main' },
    { label: BACKGROUND_EDITOR_TABS.params, slot: 'params' },
    { label: BACKGROUND_EDITOR_TABS.equipment, slot: 'equipment' },
    { label: BACKGROUND_EDITOR_TABS.grants, slot: 'grants' },
    { label: BACKGROUND_EDITOR_TABS.spells, slot: 'spells' },
    { label: BACKGROUND_EDITOR_TABS.effects, slot: 'effects' },
  ];
</script>

<template>
  <UForm
    :state
    class="grid gap-8 pb-24"
    @submit="onSubmit"
    @error="onError"
  >
    <!-- Основная информация стоит над вкладками: название и источник нужны на
      любой из них, а её вложенная форма со схемой обязана быть смонтирована в
      момент сохранения -->
    <EditorBaseInfo
      v-model="state"
      section="backgrounds"
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
        <UCard variant="subtle">
          <template #header>
            <h2 class="truncate text-base text-highlighted">
              {{ BACKGROUND_MAIN_TAB_LABELS.descriptionTitle }}
            </h2>
          </template>

          <UFormField name="description">
            <MarkupEditor
              v-model="state.description"
              :placeholder="BACKGROUND_MAIN_TAB_LABELS.descriptionPlaceholder"
            />
          </UFormField>
        </UCard>
      </template>

      <!-- ПАРАМЕТРЫ -->
      <template #params>
        <div class="grid gap-8">
          <UCard variant="subtle">
            <template #header>
              <h2 class="truncate text-base text-highlighted">
                {{ BACKGROUND_PARAMS_TAB_LABELS.detailsTitle }}
              </h2>
            </template>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-24">
              <UFormField
                class="md:col-span-12"
                :label="BACKGROUND_PARAMS_TAB_LABELS.abilities"
                :help="BACKGROUND_PARAMS_TAB_LABELS.abilitiesHelp"
                name="abilityScores"
              >
                <SelectAbilities
                  v-model="state.abilityScores"
                  :limit="3"
                  multiple
                />
              </UFormField>

              <UFormField
                class="md:col-span-12"
                :label="BACKGROUND_PARAMS_TAB_LABELS.skills"
                :help="BACKGROUND_PARAMS_TAB_LABELS.skillsHelp"
                name="skillsProficiencies"
              >
                <SelectSkill
                  v-model="state.skillsProficiencies"
                  :limit="2"
                  multiple
                />
              </UFormField>
            </div>
          </UCard>

          <UCard variant="subtle">
            <template #header>
              <h2 class="truncate text-base text-highlighted">
                {{ BACKGROUND_PARAMS_TAB_LABELS.featTitle }}
              </h2>
            </template>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-24">
              <UFormField
                class="md:col-span-12"
                :label="BACKGROUND_PARAMS_TAB_LABELS.feat"
                name="featUrl"
              >
                <SelectFeat
                  v-model="state.featUrl"
                  :categories="ORIGIN_FEAT_CATEGORIES"
                />
              </UFormField>

              <!-- Класс черты, а не свободный текст: лист персонажа сверяет
                подпись с каталогом классов и по ней сужает пул заклинаний
                «Посвящённого в магию» — с опечаткой или своим написанием
                сверка не сойдётся -->
              <UFormField
                class="md:col-span-12"
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
                :label="BACKGROUND_PARAMS_TAB_LABELS.featChoices"
                name="featChoices"
              >
                <FeatEntityRefRows
                  v-model="state.featChoices"
                  kind="FEAT"
                  :feat-categories="ORIGIN_FEAT_CATEGORIES"
                />
              </UFormField>
            </div>
          </UCard>

          <UCard variant="subtle">
            <template #header>
              <h2 class="truncate text-base text-highlighted">
                {{ BACKGROUND_PARAMS_TAB_LABELS.toolsTitle }}
              </h2>
            </template>

            <div class="grid gap-4">
              <BackgroundToolGrant
                v-model:fixed="state.toolProficiencies"
                v-model:choice="toolChoice"
              />

              <UFormField
                :label="BACKGROUND_PARAMS_TAB_LABELS.toolLegacy"
                name="toolProficiency"
              >
                <MarkupEditor
                  v-model="state.toolProficiency"
                  :placeholder="
                    BACKGROUND_PARAMS_TAB_LABELS.toolLegacyPlaceholder
                  "
                />
              </UFormField>
            </div>
          </UCard>
        </div>
      </template>

      <!-- СНАРЯЖЕНИЕ -->
      <template #equipment>
        <div class="grid gap-8">
          <StartingEquipmentEditor v-model="state.startingEquipment" />

          <UCard variant="subtle">
            <template #header>
              <h2 class="truncate text-base text-highlighted">
                {{ BACKGROUND_PARAMS_TAB_LABELS.equipment }}
              </h2>
            </template>

            <UFormField name="equipment">
              <MarkupEditor
                v-model="state.equipment"
                :placeholder="BACKGROUND_PARAMS_TAB_LABELS.equipmentPlaceholder"
              />
            </UFormField>
          </UCard>
        </div>
      </template>

      <!-- ВЛАДЕНИЯ -->
      <template #grants>
        <UCard variant="subtle">
          <template #header>
            <InfoTooltip
              :text="BACKGROUND_GRANTS_TAB_LABELS.grantsHint"
              icon="tabler:info-circle-filled"
              class="text-base text-highlighted"
            >
              <h2 class="truncate">
                {{ BACKGROUND_GRANTS_TAB_LABELS.grantsTitle }}
              </h2>
            </InfoTooltip>
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
                {{ BACKGROUND_GRANTS_TAB_LABELS.grantedSpellsTitle }}
              </h2>
            </template>

            <FeatGrantedSpells v-model="editorRows.grantedSpells" />
          </UCard>

          <UCard variant="subtle">
            <template #header>
              <h2 class="truncate text-base text-highlighted">
                {{ BACKGROUND_GRANTS_TAB_LABELS.spellListTitle }}
              </h2>
            </template>

            <FeatSpellListSpells v-model="mechanics.spellList" />
          </UCard>

          <UCard variant="subtle">
            <template #header>
              <h2 class="truncate text-base text-highlighted">
                {{ BACKGROUND_GRANTS_TAB_LABELS.spellChoicesTitle }}
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
                {{ BACKGROUND_GRANTS_TAB_LABELS.spellcastingAbilityTitle }}
              </h2>
            </template>

            <FeatSpellcastingAbility v-model="editorRows.spellChoice" />
          </UCard>
        </div>
      </template>

      <!-- ЭФФЕКТЫ -->
      <template #effects>
        <ActiveEffects
          v-model="state.activeEffects"
          :origin="EFFECT_ORIGIN.feature"
        />
      </template>
    </UTabs>

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
