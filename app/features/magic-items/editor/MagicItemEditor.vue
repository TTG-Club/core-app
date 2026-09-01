<script setup lang="ts">
  import type { TabsItem } from '@nuxt/ui';

  import type { MagicItemCreate } from '../model';

  import { ActiveEffects } from '~active-effects/editor';
  import { EFFECT_ORIGIN } from '~active-effects/model';
  import { EditorBaseInfo } from '~ui/editor';
  import { MarkupEditor } from '~ui/markup-editor';
  import { SelectItem } from '~ui/select';
  import { UploadImage } from '~ui/upload';
  import { useWorkshopForm } from '~workshop/composable';
  import { REVISION_ENTITY_TYPES } from '~workshop/revision/model';
  import { WorkshopEditorFormControls } from '~workshop/revision/ui';

  import {
    createEmptyMagicItemMechanics,
    EMPTY_MAGIC_ITEM_BONUSES,
    MAGIC_ITEM_EDITOR_SECTIONS,
    MAGIC_ITEM_EDITOR_TABS,
    MAGIC_ITEM_FORM_HINTS,
    MAGIC_ITEM_FORM_LABELS,
    normalizeLoadedMagicItem,
    normalizeMagicItemBeforeSubmit,
  } from '../model';
  import { MagicItemPreview } from '../preview';
  import {
    MagicItemAttunement,
    MagicItemBonuses,
    MagicItemCategory,
    MagicItemDamage,
    MagicItemMechanics,
    MagicItemProperties,
    MagicItemRarity,
  } from './ui';

  function getInitialState(): MagicItemCreate {
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
      category: {
        type: undefined,
        clarification: undefined,
      },
      rarity: {
        type: undefined,
        varies: undefined,
      },
      attunement: {
        requires: false,
        description: null,
      },
      charges: 0,
      curse: false,
      consumable: false,
      image: undefined,
      items: [],
      // Копия, а не сама константа: форма правит бонусы на месте.
      bonuses: { ...EMPTY_MAGIC_ITEM_BONUSES },
      damageParts: [],
      focus: false,
      adamantine: false,
      mechanics: createEmptyMagicItemMechanics(),
      tags: [],
    };
  }

  const { state, submitState, onError, onSubmit, revisionControl } =
    useWorkshopForm<MagicItemCreate>({
      actionUrl: '/api/v2/magic-items',
      getInitialState,
      revisionEntityType: REVISION_ENTITY_TYPES.MAGIC_ITEM,
      normalizeLoaded: normalizeLoadedMagicItem,
      transformBeforeSubmit: normalizeMagicItemBeforeSubmit,
    });

  const tabItems: Array<TabsItem> = [
    { label: MAGIC_ITEM_EDITOR_TABS.main, slot: 'main' },
    { label: MAGIC_ITEM_EDITOR_TABS.properties, slot: 'properties' },
    { label: MAGIC_ITEM_EDITOR_TABS.usage, slot: 'usage' },
    { label: MAGIC_ITEM_EDITOR_TABS.effects, slot: 'effects' },
  ];
</script>

<template>
  <UForm
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
      section="magic-items"
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
                {{ MAGIC_ITEM_EDITOR_SECTIONS.details }}
              </h2>
            </template>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-24">
              <MagicItemCategory v-model="state.category" />

              <MagicItemRarity v-model="state.rarity" />

              <MagicItemAttunement v-model="state.attunement" />

              <div
                class="flex flex-col gap-4 md:col-span-8 md:mt-4 lg:col-span-4"
              >
                <UFormField name="curse">
                  <UCheckbox
                    v-model="state.curse"
                    :label="MAGIC_ITEM_FORM_LABELS.curse"
                  />
                </UFormField>

                <UFormField name="consumable">
                  <UCheckbox
                    v-model="state.consumable"
                    :label="MAGIC_ITEM_FORM_LABELS.consumable"
                  />
                </UFormField>
              </div>
            </div>
          </UCard>

          <UCard variant="subtle">
            <template #header>
              <h2 class="truncate text-base text-highlighted">
                {{ MAGIC_ITEM_EDITOR_SECTIONS.description }}
              </h2>
            </template>

            <div class="grid grid-cols-1 gap-4">
              <UFormField name="description">
                <MarkupEditor
                  v-model="state.description"
                  :placeholder="MAGIC_ITEM_FORM_LABELS.descriptionPlaceholder"
                />
              </UFormField>
            </div>
          </UCard>

          <UCard variant="subtle">
            <template #header>
              <h2 class="truncate text-base text-highlighted">
                {{ MAGIC_ITEM_EDITOR_SECTIONS.images }}
              </h2>
            </template>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-24">
              <UFormField
                class="md:col-span-12 lg:col-span-8"
                :label="MAGIC_ITEM_FORM_LABELS.image"
                :help="MAGIC_ITEM_FORM_LABELS.imageHint"
                name="image"
              >
                <UploadImage
                  v-model="state.image"
                  section="magic-items"
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
            </div>
          </UCard>
        </div>
      </template>

      <!-- СВОЙСТВА -->
      <template #properties>
        <div class="grid gap-8">
          <UCard variant="subtle">
            <template #header>
              <div class="flex min-w-0 flex-col">
                <h2 class="truncate text-base text-highlighted">
                  {{ MAGIC_ITEM_EDITOR_SECTIONS.base }}
                </h2>

                <span class="text-xs text-muted">
                  {{ MAGIC_ITEM_FORM_HINTS.base }}
                </span>
              </div>
            </template>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-24">
              <UFormField
                class="col-span-full"
                :label="MAGIC_ITEM_FORM_LABELS.baseItems"
                :help="MAGIC_ITEM_FORM_LABELS.baseItemsHint"
                name="items"
              >
                <SelectItem
                  v-model="state.items"
                  multiple
                />
              </UFormField>
            </div>
          </UCard>

          <UCard variant="subtle">
            <template #header>
              <h2 class="truncate text-base text-highlighted">
                {{ MAGIC_ITEM_EDITOR_SECTIONS.bonuses }}
              </h2>
            </template>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-24">
              <MagicItemBonuses v-model="state.bonuses" />

              <MagicItemProperties
                v-model:focus="state.focus"
                v-model:adamantine="state.adamantine"
              />
            </div>
          </UCard>

          <UCard variant="subtle">
            <template #header>
              <div class="flex min-w-0 flex-col">
                <h2 class="truncate text-base text-highlighted">
                  {{ MAGIC_ITEM_EDITOR_SECTIONS.damage }}
                </h2>

                <span class="text-xs text-muted">
                  {{ MAGIC_ITEM_FORM_HINTS.damage }}
                </span>
              </div>
            </template>

            <MagicItemDamage v-model="state.damageParts" />
          </UCard>
        </div>
      </template>

      <!-- ПРИМЕНЕНИЕ -->
      <template #usage>
        <UCard
          v-if="state.mechanics"
          variant="subtle"
        >
          <template #header>
            <div class="flex min-w-0 flex-col">
              <h2 class="truncate text-base text-highlighted">
                {{ MAGIC_ITEM_EDITOR_SECTIONS.usage }}
              </h2>

              <span class="text-xs text-muted">
                {{ MAGIC_ITEM_FORM_HINTS.usage }}
              </span>
            </div>
          </template>

          <MagicItemMechanics v-model="state.mechanics" />
        </UCard>
      </template>

      <!-- ЭФФЕКТЫ -->
      <template #effects>
        <ActiveEffects
          v-if="state.mechanics"
          v-model="state.mechanics.activeEffects"
          :origin="EFFECT_ORIGIN.item"
        />
      </template>
    </UTabs>

    <WorkshopEditorFormControls :revision-control>
      <template #preview="{ opened, changeVisibility }">
        <MagicItemPreview
          :open="opened"
          :state="submitState"
          @update:open="changeVisibility"
        />
      </template>
    </WorkshopEditorFormControls>
  </UForm>
</template>
