<script setup lang="ts">
  import type { TabsItem } from '@nuxt/ui';

  import type { SpeciesCreate } from '../model';

  import { ActiveEffects } from '~active-effects/editor';
  import { EFFECT_ORIGIN } from '~active-effects/model';
  import { FeatGrantRows, FeatModifierRows } from '~feats/editor/ui';
  import { createFeatEditorRows, createFeatMechanics } from '~feats/model';
  import { SpeciesPreview } from '~species/preview';
  import { EditorBaseInfo } from '~ui/editor';
  import { MarkupEditor } from '~ui/markup-editor';
  import { SelectCreatureType, SelectSpecies } from '~ui/select';
  import { InfoTooltip } from '~ui/tooltip';
  import { UploadGallery, UploadImage } from '~ui/upload';
  import { useWorkshopForm } from '~workshop/composable';
  import { REVISION_ENTITY_TYPES } from '~workshop/revision/model';
  import { WorkshopEditorFormControls } from '~workshop/revision/ui';

  import {
    normalizeLoadedSpecies,
    SPECIES_EDITOR_LABELS,
    SPECIES_EDITOR_TABS,
    transformSpeciesBeforeSubmit,
  } from '../model';
  import { SpeciesFeatures, SpeciesSizes, SpeciesSpeed } from './ui';

  /**
   * Пустой вид, с которым открывается форма создания. Механика и строки
   * редактора здесь всегда объекты: загрузка сливает ответ сервера именно с
   * этим состоянием, и недостающие блоки берутся отсюда.
   *
   * @returns начальное состояние формы.
   */
  function getInitialState(): SpeciesCreate {
    return {
      url: '',
      name: {
        rus: '',
        eng: '',
        alt: [],
      },
      description: '',
      image: undefined,
      linkImage: undefined,
      gallery: [],
      parent: undefined,
      source: {
        url: undefined,
        page: undefined,
      },
      srdVersion: undefined,
      properties: {
        sizes: [],
        type: undefined,
        speed: {
          base: 30,
          fly: undefined,
          climb: undefined,
          swim: undefined,
          hover: false,
        },
        vision: undefined,
      },
      features: [],
      innateSpells: [],
      mechanics: createFeatMechanics(),
      activeEffects: [],
      editorRows: createFeatEditorRows(),
      tags: [],
    };
  }

  const { state, submitState, onError, onSubmit, revisionControl } =
    useWorkshopForm<SpeciesCreate>({
      actionUrl: '/api/v2/species',
      getInitialState,
      revisionEntityType: REVISION_ENTITY_TYPES.SPECIES,
      normalizeLoaded: normalizeLoadedSpecies,
      transformBeforeSubmit: transformSpeciesBeforeSubmit,
    });

  /**
   * Строки редактора даров записи. В типе они необязательны — перед отправкой
   * механика пересобирается из них, а сами строки выбрасываются, — поэтому
   * шаблону нужен непустой объект.
   */
  const editorRows = computed({
    get: () => state.value.editorRows ?? createFeatEditorRows(),
    set: (value) => {
      state.value.editorRows = value;
    },
  });

  const tabItems: Array<TabsItem> = [
    { label: SPECIES_EDITOR_TABS.main, slot: 'main' },
    { label: SPECIES_EDITOR_TABS.properties, slot: 'properties' },
    // Порядок тот же, что у формы вида в системе D&D: сперва дары самой
    // записи, потом особенности с их собственными дарами
    { label: SPECIES_EDITOR_TABS.grants, slot: 'grants' },
    { label: SPECIES_EDITOR_TABS.features, slot: 'features' },
    { label: SPECIES_EDITOR_TABS.effects, slot: 'effects' },
    { label: SPECIES_EDITOR_TABS.images, slot: 'images' },
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
      section="species"
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
              {{ SPECIES_EDITOR_LABELS.descriptionTitle }}
            </h2>
          </template>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-24">
            <UFormField
              class="col-span-full md:col-span-12"
              :label="SPECIES_EDITOR_LABELS.parent"
              :help="SPECIES_EDITOR_LABELS.parentHint"
              name="parent"
            >
              <SelectSpecies v-model="state.parent" />
            </UFormField>

            <UFormField
              class="col-span-full"
              :label="SPECIES_EDITOR_LABELS.description"
              name="description"
            >
              <MarkupEditor
                v-model="state.description"
                :placeholder="SPECIES_EDITOR_LABELS.descriptionPlaceholder"
              />
            </UFormField>
          </div>
        </UCard>
      </template>

      <!-- ХАРАКТЕРИСТИКИ: без заголовка карточки — он дословно повторял бы
        подпись самой вкладки -->
      <template #properties>
        <UCard variant="subtle">
          <div class="grid grid-cols-1 gap-4 md:grid-cols-24">
            <UFormField
              class="col-span-full md:col-span-12"
              :label="SPECIES_EDITOR_LABELS.creatureType"
              name="properties.type"
            >
              <SelectCreatureType v-model="state.properties.type" />
            </UFormField>

            <UFormField
              class="col-span-full md:col-span-12"
              :label="SPECIES_EDITOR_LABELS.vision"
              :help="SPECIES_EDITOR_LABELS.visionHint"
              name="properties.vision"
            >
              <UInputNumber
                v-model="state.properties.vision"
                :min="0"
                :max="SPECIES_EDITOR_LABELS.visionMax"
                :step="SPECIES_EDITOR_LABELS.visionStep"
              />
            </UFormField>

            <p class="col-span-full text-sm text-dimmed">
              {{ SPECIES_EDITOR_LABELS.sensesHint }}
            </p>

            <SpeciesSizes v-model="state.properties.sizes" />

            <SpeciesSpeed v-model="state.properties.speed" />
          </div>
        </UCard>
      </template>

      <!-- ОСОБЕННОСТИ: без заголовка карточки — он дословно повторял бы
        подпись самой вкладки -->
      <template #features>
        <UCard variant="subtle">
          <SpeciesFeatures v-model="state.features" />
        </UCard>
      </template>

      <!-- ДАРЫ -->
      <template #grants>
        <div class="grid gap-8">
          <UCard variant="subtle">
            <template #header>
              <InfoTooltip
                :text="SPECIES_EDITOR_LABELS.grantsHint"
                icon="tabler:info-circle-filled"
                class="text-base text-highlighted"
              >
                <h2 class="truncate">
                  {{ SPECIES_EDITOR_LABELS.grantsTitle }}
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
                {{ SPECIES_EDITOR_LABELS.modifiersTitle }}
              </h2>
            </template>

            <FeatModifierRows
              v-model="editorRows.modifiers"
              :rows="editorRows"
            />
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
              {{ SPECIES_EDITOR_TABS.images }}
            </h2>
          </template>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-24">
            <UFormField
              class="col-span-full md:col-span-8"
              label="Основное"
              help="Эта картинка отображается при просмотре страницы вида"
              name="image"
            >
              <UploadImage
                v-model="state.image"
                section="species"
                max-size="1024"
              >
                <template #preview>
                  <NuxtImg
                    v-slot="{ src, isLoaded, imgAttrs }"
                    :key="state.image"
                    :src="state.image"
                    custom
                  >
                    <!-- Show the actual image when loaded -->
                    <img
                      v-if="isLoaded"
                      v-bind="imgAttrs"
                      class="w-full rounded-lg object-contain"
                      :src="src"
                      :alt="state.name.rus"
                    />

                    <!-- Show a placeholder while loading -->
                    <img
                      v-else
                      class="w-full rounded-lg object-contain"
                      src="/img/no-img.webp"
                      alt="no image"
                    />
                  </NuxtImg>
                </template>
              </UploadImage>
            </UFormField>

            <UFormField
              class="col-span-full md:col-span-8"
              label="Для ссылки"
              help="Эта картинка отображается на странице со списком видов"
              name="linkImage"
            >
              <UploadImage
                v-model="state.linkImage"
                section="species"
                max-size="256"
              >
                <template #preview>
                  <NuxtImg
                    v-slot="{ src, isLoaded, imgAttrs }"
                    :key="state.linkImage"
                    :src="state.linkImage"
                    custom
                  >
                    <!-- Show the actual image when loaded -->
                    <img
                      v-if="isLoaded"
                      v-bind="imgAttrs"
                      class="aspect-square w-full rounded-lg object-cover"
                      :src="src"
                      :alt="state.name.rus"
                    />

                    <!-- Show a placeholder while loading -->
                    <img
                      v-else
                      class="w-full rounded-lg object-contain"
                      src="/img/no-img.webp"
                      alt="no image"
                    />
                  </NuxtImg>
                </template>
              </UploadImage>
            </UFormField>

            <UFormField
              class="col-span-full md:col-span-8"
              label="Галерея"
              name="gallery"
            >
              <UploadGallery
                v-model="state.gallery"
                section="species"
              />
            </UFormField>
          </div>
        </UCard>
      </template>
    </UTabs>

    <WorkshopEditorFormControls :revision-control>
      <template #preview="{ opened, changeVisibility }">
        <SpeciesPreview
          :open="opened"
          :state="submitState"
          @update:open="changeVisibility"
        />
      </template>
    </WorkshopEditorFormControls>
  </UForm>
</template>
