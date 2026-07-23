<script setup lang="ts">
  import type { TabsItem } from '@nuxt/ui';

  import type {
    CharacterCurrency,
    CharacterFeature,
    CharacterInventoryItem,
    CharacterSpell,
  } from '../../model';

  import {
    SHEET_TAB_EMPTY_LABELS,
    SHEET_TABS,
    WEIGHT_UNIT_LABEL,
  } from '../../model';
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

  // Заглушкой осталась только вкладка «Эффекты» — у остальных свой контент.
  const emptyTabItems = Object.entries(SHEET_TAB_EMPTY_LABELS)
    .filter(([slot]) => slot === 'effects')
    .map(([slot, label]) => ({ slot, label }));

  const tabItems = computed<TabsItem[]>(() =>
    SHEET_TABS.map((tab) =>
      tab.slot === 'equipment'
        ? {
            ...tab,
            label: `${tab.label} (${props.totalWeight} / ${props.carryingCapacity} ${WEIGHT_UNIT_LABEL})`,
          }
        : { ...tab },
    ),
  );
</script>

<template>
  <UTabs
    :items="tabItems"
    color="warning"
    variant="link"
    class="w-full"
  >
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

    <template
      v-for="emptyTab in emptyTabItems"
      :key="emptyTab.slot"
      #[emptyTab.slot]
    >
      <div
        class="mt-2 flex h-64 items-center justify-center rounded-lg border border-dashed border-default text-sm text-dimmed"
      >
        {{ emptyTab.label }}
      </div>
    </template>
  </UTabs>
</template>
