<script setup lang="ts">
  import type { TabsItem } from '@nuxt/ui';

  import type { AbilityKey } from '~/shared/types';

  import type { ClassCreate, ClassLinkResponse } from '../model';

  import { ActiveEffects } from '~active-effects/editor';
  import { EFFECT_ORIGIN } from '~active-effects/model';
  import { ClassPreview } from '~classes/preview';
  import {
    FeatCounterRows,
    FeatGrantedSpells,
    FeatGrantRows,
    FeatModifierRows,
  } from '~feats/editor/ui';
  import { createFeatEditorRows, createFeatMechanics } from '~feats/model';
  import { EditorBaseInfo, StartingEquipmentEditor } from '~ui/editor';
  import { MarkupEditor } from '~ui/markup-editor';
  import { SelectAbilities, SelectCasterType } from '~ui/select';
  import { InfoTooltip } from '~ui/tooltip';
  import { UploadGallery, UploadImage } from '~ui/upload';
  import { useWorkshopForm } from '~workshop/composable';
  import { REVISION_ENTITY_TYPES } from '~workshop/revision/model';
  import { WorkshopEditorFormControls } from '~workshop/revision/ui';

  import {
    CLASS_EDITOR_LABELS,
    CLASS_EDITOR_TABS,
    CLASS_LEVEL_BOUNDS,
    normalizeLoadedClass,
    transformClassBeforeSubmit,
  } from '../model';
  import {
    CharacteristicsSettings,
    FeaturesEditor,
    MulticlassProficiencySettings,
    ProficiencySettings,
    TableEditor,
  } from './ui';

  /**
   * Пустой класс, с которым открывается форма создания. Механика и строки
   * редактора здесь всегда объекты: загрузка сливает ответ сервера именно с
   * этим состоянием, и недостающие блоки берутся отсюда.
   *
   * @returns начальное состояние формы.
   */
  function getInitialState(): ClassCreate {
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
      image: undefined,
      gallery: [],
      description: undefined,
      parentUrl: undefined,
      hitDice: undefined,
      primaryCharacteristics: {
        values: undefined,
        delimiter: undefined,
      },
      savingThrows: [],
      proficiency: {
        armor: {
          category: [],
          custom: undefined,
        },
        weapon: {
          category: [],
          custom: undefined,
        },
        tool: undefined,
        skill: {
          count: 0,
          skills: [],
        },
      },
      multiclassProficiency: {
        armor: {
          category: [],
          custom: undefined,
        },
        weapon: {
          category: [],
          custom: undefined,
        },
        toolProficiency: undefined,
        skills: 0,
      },
      equipment: undefined,
      startingEquipment: [],
      features: [],
      table: [],
      abilityTemplate: undefined,
      casterType: undefined,
      spellcastingAbility: undefined,
      spellcastingStartLevel: undefined,
      subclassLabel: undefined,
      subclassLevel: undefined,
      mechanics: createFeatMechanics(),
      activeEffects: [],
      editorRows: createFeatEditorRows(),
      tags: [],
    };
  }

  const { state, submitState, onError, onSubmit, revisionControl } =
    useWorkshopForm<ClassCreate>({
      actionUrl: '/api/v2/classes',
      getInitialState,
      revisionEntityType: REVISION_ENTITY_TYPES.CLASS,
      normalizeLoaded: normalizeLoadedClass,
      transformBeforeSubmit: transformClassBeforeSubmit,
    });

  const { data: classLinks } =
    useNuxtData<ClassLinkResponse[]>('classes-select');

  const parentClass = computed<ClassLinkResponse | undefined>(() => {
    if (!state.value.parentUrl) {
      return undefined;
    }

    return classLinks.value?.find(
      (classLink) => classLink.url === state.value.parentUrl,
    );
  });

  /**
   * Строки редактора даров класса. В типе они необязательны — перед отправкой
   * механика пересобирается из них, а сами строки выбрасываются, — поэтому
   * шаблону нужен непустой объект.
   */
  const editorRows = computed({
    get: () => state.value.editorRows ?? createFeatEditorRows(),
    set: (value) => {
      state.value.editorRows = value;
    },
  });

  /** Механика класса: из неё редактируются заклинания, минуя строки. */
  const mechanics = computed({
    get: () => state.value.mechanics ?? createFeatMechanics(),
    set: (value) => {
      state.value.mechanics = value;
    },
  });

  /**
   * Заклинательная характеристика одним значением.
   *
   * Селект характеристик умеет и множественный выбор, поэтому отдаёт то одно
   * значение, то список; классу нужна ровно одна характеристика, и лишнее здесь
   * отсекается, а не расходится по всей форме.
   */
  const spellcastingAbility = computed({
    get: () => state.value.spellcastingAbility,
    set: (value: AbilityKey | Array<AbilityKey> | undefined) => {
      state.value.spellcastingAbility = Array.isArray(value) ? value[0] : value;
    },
  });

  // Порядок тот же, что у формы класса в системе D&D: владения перед
  // заклинательством, таблица прогрессии перед умениями, дары (в системе —
  // «Счётчики») перед снаряжением
  const tabItems: Array<TabsItem> = [
    { label: CLASS_EDITOR_TABS.main, slot: 'main' },
    { label: CLASS_EDITOR_TABS.proficiencies, slot: 'proficiencies' },
    { label: CLASS_EDITOR_TABS.spellcasting, slot: 'spellcasting' },
    { label: CLASS_EDITOR_TABS.table, slot: 'table' },
    { label: CLASS_EDITOR_TABS.features, slot: 'features' },
    { label: CLASS_EDITOR_TABS.grants, slot: 'grants' },
    { label: CLASS_EDITOR_TABS.equipment, slot: 'equipment' },
    { label: CLASS_EDITOR_TABS.effects, slot: 'effects' },
    { label: CLASS_EDITOR_TABS.images, slot: 'images' },
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
      section="classes"
      :prefix="parentClass?.name.eng"
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
          <CharacteristicsSettings
            v-model:parent-url="state.parentUrl"
            v-model:hit-dice="state.hitDice"
            v-model:primary-characteristics="state.primaryCharacteristics"
            v-model:saving-throws="state.savingThrows"
            v-model:ability-template="state.abilityTemplate"
          />

          <UCard variant="subtle">
            <template #header>
              <h2 class="truncate text-base text-highlighted">
                {{ CLASS_EDITOR_LABELS.subclassesTitle }}
              </h2>
            </template>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-24">
              <UFormField
                class="col-span-full md:col-span-12"
                :label="CLASS_EDITOR_LABELS.subclassLabel"
                name="subclassLabel"
              >
                <UInput
                  v-model="state.subclassLabel"
                  :placeholder="CLASS_EDITOR_LABELS.subclassLabelPlaceholder"
                />
              </UFormField>

              <UFormField
                class="col-span-full md:col-span-12"
                :label="CLASS_EDITOR_LABELS.subclassLevel"
                :help="CLASS_EDITOR_LABELS.subclassLevelHint"
                name="subclassLevel"
              >
                <UInputNumber
                  v-model="state.subclassLevel"
                  :min="CLASS_LEVEL_BOUNDS.min"
                  :max="CLASS_LEVEL_BOUNDS.max"
                />
              </UFormField>
            </div>
          </UCard>

          <UCard variant="subtle">
            <template #header>
              <h2 class="truncate text-base text-highlighted">
                {{ CLASS_EDITOR_LABELS.descriptionTitle }}
              </h2>
            </template>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-24">
              <UFormField
                class="col-span-full"
                name="description"
              >
                <MarkupEditor
                  v-model="state.description"
                  :placeholder="CLASS_EDITOR_LABELS.descriptionPlaceholder"
                />
              </UFormField>
            </div>
          </UCard>
        </div>
      </template>

      <!-- ЗАКЛИНАТЕЛЬСТВО -->
      <template #spellcasting>
        <div class="grid gap-8">
          <UCard variant="subtle">
            <template #header>
              <h2 class="truncate text-base text-highlighted">
                {{ CLASS_EDITOR_LABELS.spellcastingTitle }}
              </h2>
            </template>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-24">
              <UFormField
                class="col-span-full md:col-span-8"
                :label="CLASS_EDITOR_LABELS.casterType"
                name="casterType"
              >
                <SelectCasterType v-model="state.casterType" />
              </UFormField>

              <UFormField
                class="col-span-full md:col-span-8"
                :label="CLASS_EDITOR_LABELS.spellcastingAbility"
                :help="CLASS_EDITOR_LABELS.spellcastingAbilityHint"
                name="spellcastingAbility"
              >
                <SelectAbilities v-model="spellcastingAbility" />
              </UFormField>

              <UFormField
                class="col-span-full md:col-span-8"
                :label="CLASS_EDITOR_LABELS.spellcastingStartLevel"
                :help="CLASS_EDITOR_LABELS.spellcastingStartLevelHint"
                name="spellcastingStartLevel"
              >
                <UInputNumber
                  v-model="state.spellcastingStartLevel"
                  :min="CLASS_LEVEL_BOUNDS.min"
                  :max="CLASS_LEVEL_BOUNDS.max"
                />
              </UFormField>
            </div>
          </UCard>
        </div>
      </template>

      <!-- ВЛАДЕНИЯ -->
      <template #proficiencies>
        <div class="grid gap-8">
          <ProficiencySettings v-model="state.proficiency" />

          <MulticlassProficiencySettings
            v-model="state.multiclassProficiency"
          />
        </div>
      </template>

      <!-- СНАРЯЖЕНИЕ -->
      <template #equipment>
        <div class="grid gap-8">
          <UCard variant="subtle">
            <template #header>
              <h2 class="truncate text-base text-highlighted">
                {{ CLASS_EDITOR_LABELS.equipmentTitle }}
              </h2>
            </template>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-24">
              <UFormField
                class="col-span-full"
                name="equipment"
              >
                <MarkupEditor
                  v-model="state.equipment"
                  :placeholder="CLASS_EDITOR_LABELS.equipmentPlaceholder"
                />
              </UFormField>
            </div>
          </UCard>

          <StartingEquipmentEditor v-model="state.startingEquipment" />
        </div>
      </template>

      <!-- УМЕНИЯ -->
      <template #features>
        <FeaturesEditor
          v-model="state.features"
          :is-subclass="!!state.parentUrl"
        />
      </template>

      <!-- ТАБЛИЦА -->
      <template #table>
        <TableEditor v-model="state.table" />
      </template>

      <!-- ДАРЫ -->
      <template #grants>
        <div class="grid gap-8">
          <UCard variant="subtle">
            <template #header>
              <InfoTooltip
                :text="CLASS_EDITOR_LABELS.grantsHint"
                icon="tabler:info-circle-filled"
                class="text-base text-highlighted"
              >
                <h2 class="truncate">
                  {{ CLASS_EDITOR_LABELS.grantsTitle }}
                </h2>
              </InfoTooltip>
            </template>

            <FeatGrantRows
              v-model="editorRows.grants"
              :rows="editorRows"
            />
          </UCard>

          <UCard variant="subtle">
            <template #header>
              <h2 class="truncate text-base text-highlighted">
                {{ CLASS_EDITOR_LABELS.modifiersTitle }}
              </h2>
            </template>

            <FeatModifierRows
              v-model="editorRows.modifiers"
              :rows="editorRows"
            />
          </UCard>

          <UCard variant="subtle">
            <template #header>
              <InfoTooltip
                :text="CLASS_EDITOR_LABELS.countersHint"
                icon="tabler:info-circle-filled"
                class="text-base text-highlighted"
              >
                <h2 class="truncate">
                  {{ CLASS_EDITOR_LABELS.countersTitle }}
                </h2>
              </InfoTooltip>
            </template>

            <FeatCounterRows v-model="editorRows.counters" />
          </UCard>

          <UCard variant="subtle">
            <template #header>
              <h2 class="truncate text-base text-highlighted">
                {{ CLASS_EDITOR_LABELS.spellsTitle }}
              </h2>
            </template>

            <FeatGrantedSpells v-model="mechanics.spells" />
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

      <!-- ИЗОБРАЖЕНИЯ -->
      <template #images>
        <UCard variant="subtle">
          <template #header>
            <h2 class="truncate text-base text-highlighted">
              {{ CLASS_EDITOR_TABS.images }}
            </h2>
          </template>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-24">
            <UFormField
              class="col-span-full md:col-span-12"
              label="Основное"
              name="image"
            >
              <UploadImage
                v-model="state.image"
                section="classes"
                max-size="1024"
              >
                <template #preview>
                  <div class="relative w-48 overflow-hidden rounded-lg">
                    <img
                      :src="state.image || '/img/no-img.webp'"
                      alt="Uploaded image"
                      class="h-full w-full object-contain"
                    />
                  </div>
                </template>
              </UploadImage>
            </UFormField>

            <UFormField
              class="col-span-full md:col-span-12"
              label="Галерея"
              name="gallery"
            >
              <UploadGallery
                v-model="state.gallery"
                section="classes"
              />
            </UFormField>
          </div>
        </UCard>
      </template>
    </UTabs>

    <WorkshopEditorFormControls :revision-control>
      <template #preview="{ opened, changeVisibility }">
        <ClassPreview
          :open="opened"
          :state="submitState"
          @update:open="changeVisibility"
        />
      </template>
    </WorkshopEditorFormControls>
  </UForm>
</template>
