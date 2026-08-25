<script setup lang="ts">
  import type { TabsItem } from '@nuxt/ui';

  import type { ItemCreate } from '~items/model';

  import { ActiveEffects } from '~active-effects/editor';
  import { EFFECT_ORIGIN } from '~active-effects/model';
  import {
    createEmptyItem,
    ITEM_CATEGORY_OPTIONS,
    ITEM_EDITOR_SECTIONS,
    ITEM_EDITOR_TABS,
    ITEM_FORM_LABELS,
    normalizeItemBeforeSubmit,
    normalizeLoadedItem,
  } from '~items/model';
  import { ItemPreview } from '~items/preview';
  import { EditorBaseInfo } from '~ui/editor';
  import { MarkupEditor } from '~ui/markup-editor';
  import { UploadImage } from '~ui/upload';
  import { useWorkshopForm } from '~workshop/composable';
  import { REVISION_ENTITY_TYPES } from '~workshop/revision/model';
  import { WorkshopEditorFormControls } from '~workshop/revision/ui';

  import {
    ArmorForm,
    CoinsType,
    GearForm,
    ItemCategorySwitch,
    ItemType,
    LegacyWeaponDamage,
    ToolForm,
    WeaponForm,
  } from './ui';

  const { state, submitState, onError, onSubmit, revisionControl } =
    useWorkshopForm<ItemCreate>({
      actionUrl: '/api/v2/item',
      getInitialState: createEmptyItem,
      normalizeLoaded: normalizeLoadedItem,
      transformBeforeSubmit: normalizeItemBeforeSubmit,
      revisionEntityType: REVISION_ENTITY_TYPES.ITEM,
    });

  const isWeapon = computed(() => state.value.category === 'WEAPON');

  /**
   * Подпись вкладки с параметрами — по выбранной категории: у оружия там бой,
   * у доспеха защита, у инструмента владение. Так вкладка называет то, что в
   * ней лежит, а не «Параметры» вообще.
   */
  const categoryTabLabel = computed(
    () =>
      ITEM_CATEGORY_OPTIONS.find(
        (option) => option.value === state.value.category,
      )?.label ?? ITEM_EDITOR_SECTIONS.gear,
  );

  /**
   * Вкладка прежнего представления урона есть только у оружия: доспеху и
   * снаряжению нечего в ней показывать.
   */
  const tabItems = computed<Array<TabsItem>>(() => {
    const items: Array<TabsItem> = [
      { label: ITEM_EDITOR_TABS.main, slot: 'main' },
      { label: categoryTabLabel.value, slot: 'category' },
    ];

    if (isWeapon.value) {
      items.push({ label: ITEM_EDITOR_TABS.compatibility, slot: 'legacy' });
    }

    items.push({ label: ITEM_EDITOR_TABS.effects, slot: 'effects' });

    return items;
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
      section="items"
    />

    <!-- Переключатель рода предмета: он решает, какие боевые параметры у
      записи вообще есть, поэтому стоит до вкладок, а не внутри одной из них -->
    <UCard variant="subtle">
      <template #header>
        <div class="flex min-w-0 flex-col">
          <h2 class="truncate text-base text-highlighted">
            {{ ITEM_EDITOR_SECTIONS.category }}
          </h2>

          <span class="text-xs text-muted">
            {{ ITEM_FORM_LABELS.categoryHint }}
          </span>
        </div>
      </template>

      <UFormField name="category">
        <ItemCategorySwitch v-model="state.category" />
      </UFormField>
    </UCard>

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
                {{ ITEM_EDITOR_SECTIONS.details }}
              </h2>
            </template>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-24">
              <UFormField
                class="md:col-span-24"
                :label="ITEM_FORM_LABELS.types"
                :tooltip="ITEM_FORM_LABELS.typesHint"
                name="types"
              >
                <ItemType
                  v-model="state.types"
                  multiple
                />
              </UFormField>

              <UFormField
                class="md:col-span-8"
                :label="ITEM_FORM_LABELS.cost"
                name="cost"
              >
                <UInput
                  v-model="state.cost"
                  :precision="0"
                  :placeholder="ITEM_FORM_LABELS.costPlaceholder"
                  min="0"
                />
              </UFormField>

              <UFormField
                class="md:col-span-8"
                :label="ITEM_FORM_LABELS.coin"
                name="coin"
              >
                <CoinsType v-model="state.coin" />
              </UFormField>

              <UFormField
                class="md:col-span-8"
                :label="ITEM_FORM_LABELS.weight"
                name="weight"
              >
                <UInput
                  v-model="state.weight"
                  :placeholder="ITEM_FORM_LABELS.weightPlaceholder"
                />
              </UFormField>
            </div>
          </UCard>

          <UCard variant="subtle">
            <template #header>
              <h2 class="truncate text-base text-highlighted">
                {{ ITEM_EDITOR_SECTIONS.description }}
              </h2>
            </template>

            <UFormField
              :label="ITEM_FORM_LABELS.description"
              name="description"
            >
              <MarkupEditor
                v-model="state.description"
                :placeholder="ITEM_FORM_LABELS.descriptionPlaceholder"
              />
            </UFormField>
          </UCard>

          <UCard variant="subtle">
            <template #header>
              <h2 class="truncate text-base text-highlighted">
                {{ ITEM_EDITOR_SECTIONS.images }}
              </h2>
            </template>

            <UFormField
              :label="ITEM_FORM_LABELS.image"
              :tooltip="ITEM_FORM_LABELS.imageHint"
              name="image"
            >
              <UploadImage
                v-model="state.image"
                section="item"
                max-size="480"
              />
            </UFormField>
          </UCard>
        </div>
      </template>

      <!-- ПАРАМЕТРЫ ВЫБРАННОЙ КАТЕГОРИИ -->
      <template #category>
        <WeaponForm
          v-if="state.category === 'WEAPON'"
          v-model="state.weapon"
        />

        <ArmorForm
          v-else-if="state.category === 'ARMOR'"
          v-model="state.armor"
        />

        <ToolForm
          v-else-if="state.category === 'TOOL'"
          v-model="state.tool"
        />

        <GearForm
          v-else
          v-model="state.equipmentCategory"
        />
      </template>

      <!-- СОВМЕСТИМОСТЬ -->
      <template #legacy>
        <LegacyWeaponDamage :weapon="state.weapon" />
      </template>

      <!-- ЭФФЕКТЫ -->
      <template #effects>
        <ActiveEffects
          v-model="state.activeEffects"
          :origin="EFFECT_ORIGIN.item"
        />
      </template>
    </UTabs>

    <WorkshopEditorFormControls :revision-control>
      <template #preview="{ opened, changeVisibility }">
        <ItemPreview
          :open="opened"
          :state="submitState"
          @update:open="changeVisibility"
        />
      </template>
    </WorkshopEditorFormControls>
  </UForm>
</template>
