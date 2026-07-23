<script setup lang="ts">
  import type { TabsItem } from '@nuxt/ui';

  import type {
    CharacterCurrency,
    CharacterFeature,
    CharacterInventoryItem,
    CharacterSpell,
  } from '../../model';

  import { SHEET_MAIN_TAB, SHEET_TABS, WEIGHT_UNIT_LABEL } from '../../model';
  import SheetEquipmentTab from './SheetEquipmentTab.vue';
  import SheetFeaturesTab from './SheetFeaturesTab.vue';
  import SheetNotesTab from './SheetNotesTab.vue';
  import SheetSpellsTab from './SheetSpellsTab.vue';

  const props = defineProps<{
    currency: CharacterCurrency;
    inventory: CharacterInventoryItem[];
    totalWeight: number;
    carryingCapacity: number;
    features: CharacterFeature[];
    spells: CharacterSpell[];

    /**
     * Добавляет первой вкладку «Основное» (контент — через слот `#main`).
     * Включается при ≤1023, где двух колонок в сетке уже нет.
     */
    hasMainTab?: boolean;
  }>();

  const emit = defineEmits<{
    'add-feature': [];
    'add-feat': [];
    'add-item': [];
    'add-magic-item': [];
    'add-spell': [];
    'adjust-item-quantity': [inventoryItemId: string, delta: number];
    'edit-choice': [featureId: string, choice: string];
    'remove-feature': [featureId: string];
    'remove-item': [inventoryItemId: string];
    'remove-spell': [spellUrl: string];
  }>();

  function handleItemAdd() {
    emit('add-item');
  }

  function handleMagicItemAdd() {
    emit('add-magic-item');
  }

  function handleItemRemove(inventoryItemId: string) {
    emit('remove-item', inventoryItemId);
  }

  function handleItemQuantityAdjust(inventoryItemId: string, delta: number) {
    emit('adjust-item-quantity', inventoryItemId, delta);
  }

  function handleSpellAdd() {
    emit('add-spell');
  }

  function handleSpellRemove(spellUrl: string) {
    emit('remove-spell', spellUrl);
  }

  function handleFeatureAdd() {
    emit('add-feature');
  }

  function handleFeatAdd() {
    emit('add-feat');
  }

  function handleChoiceEdit(featureId: string, choice: string) {
    emit('edit-choice', featureId, choice);
  }

  function handleFeatureRemove(featureId: string) {
    emit('remove-feature', featureId);
  }

  // Ниже md пять вкладок с полными подписями не помещаются и режутся
  // многоточием — подставляем короткие подписи вместо обрезки.
  const { isMdOrGreater } = useBreakpoints();

  const tabItems = computed<TabsItem[]>(() => {
    const useShort = !isMdOrGreater.value;

    const items = SHEET_TABS.map((tab) => {
      const base = useShort ? tab.shortLabel : tab.label;

      return {
        slot: tab.slot,
        label:
          tab.slot === 'equipment' && !useShort
            ? `${base} (${props.totalWeight} / ${props.carryingCapacity} ${WEIGHT_UNIT_LABEL})`
            : base,
      };
    });

    return props.hasMainTab
      ? [
          {
            slot: SHEET_MAIN_TAB.slot,
            label: useShort ? SHEET_MAIN_TAB.shortLabel : SHEET_MAIN_TAB.label,
          },
          ...items,
        ]
      : items;
  });
</script>

<template>
  <UTabs
    :items="tabItems"
    color="warning"
    variant="link"
    class="w-full"
  >
    <template #main>
      <div class="pt-4">
        <slot name="main" />
      </div>
    </template>

    <template #equipment>
      <SheetEquipmentTab
        :currency="currency"
        :inventory="inventory"
        @add-item="handleItemAdd"
        @add-magic-item="handleMagicItemAdd"
        @remove-item="handleItemRemove"
        @adjust-quantity="handleItemQuantityAdjust"
      />
    </template>

    <template #spells>
      <SheetSpellsTab
        :spells="spells"
        @add-spell="handleSpellAdd"
        @remove-spell="handleSpellRemove"
      />
    </template>

    <template #features>
      <SheetFeaturesTab
        :features="features"
        @add-feature="handleFeatureAdd"
        @add-feat="handleFeatAdd"
        @edit-choice="handleChoiceEdit"
        @remove-feature="handleFeatureRemove"
      />
    </template>

    <template #notes>
      <SheetNotesTab />
    </template>
  </UTabs>
</template>
