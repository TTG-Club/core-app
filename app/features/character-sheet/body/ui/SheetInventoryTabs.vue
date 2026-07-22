<script setup lang="ts">
  import type { TabsItem } from '@nuxt/ui';

  import type {
    CharacterCurrency,
    CharacterFeature,
    CharacterSpell,
    CharacterInventorySection as InventorySection,
  } from '../../model';

  import {
    SHEET_TAB_EMPTY_LABELS,
    SHEET_TABS,
    WEIGHT_UNIT_LABEL,
  } from '../../model';
  import SheetCurrencyRow from './SheetCurrencyRow.vue';
  import SheetFeaturesTab from './SheetFeaturesTab.vue';
  import SheetInventorySection from './SheetInventorySection.vue';
  import SheetSpellsTab from './SheetSpellsTab.vue';

  const props = defineProps<{
    currency: CharacterCurrency;
    inventory: InventorySection[];
    totalWeight: number;
    carryingCapacity: number;
    features: CharacterFeature[];
    spells: CharacterSpell[];
  }>();

  const emit = defineEmits<{
    'add-feature': [];
    'add-spell': [];
    'edit-choice': [featureId: string, choice: string];
    'remove-feature': [featureId: string];
    'remove-spell': [spellUrl: string];
  }>();

  function handleSpellAdd() {
    emit('add-spell');
  }

  function handleSpellRemove(spellUrl: string) {
    emit('remove-spell', spellUrl);
  }

  function handleFeatureAdd() {
    emit('add-feature');
  }

  function handleChoiceEdit(featureId: string, choice: string) {
    emit('edit-choice', featureId, choice);
  }

  function handleFeatureRemove(featureId: string) {
    emit('remove-feature', featureId);
  }

  // Вкладки «Особенности» и «Заклинания» больше не пустышки — у них свой
  // контент.
  const emptyTabItems = Object.entries(SHEET_TAB_EMPTY_LABELS)
    .filter(([slot]) => slot !== 'features' && slot !== 'spells')
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
      <div class="flex flex-col gap-4 pt-2">
        <SheetCurrencyRow :currency="currency" />

        <SheetInventorySection
          v-for="section in inventory"
          :key="section.title"
          :section="section"
        />
      </div>
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
        @edit-choice="handleChoiceEdit"
        @remove-feature="handleFeatureRemove"
      />
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
