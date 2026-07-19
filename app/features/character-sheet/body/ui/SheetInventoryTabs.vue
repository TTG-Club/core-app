<script setup lang="ts">
  import type { TabsItem } from '@nuxt/ui';

  import type {
    CharacterCurrency,
    CharacterInventorySection as InventorySection,
  } from '../../model';

  import {
    SHEET_TAB_EMPTY_LABELS,
    SHEET_TABS,
    WEIGHT_UNIT_LABEL,
  } from '../../model';
  import SheetCurrencyRow from './SheetCurrencyRow.vue';
  import SheetInventorySection from './SheetInventorySection.vue';

  const props = defineProps<{
    currency: CharacterCurrency;
    inventory: InventorySection[];
    totalWeight: number;
    carryingCapacity: number;
  }>();

  const emptyTabItems = Object.entries(SHEET_TAB_EMPTY_LABELS).map(
    ([slot, label]) => ({ slot, label }),
  );

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
