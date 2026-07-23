<script setup lang="ts">
  import type { CharacterCurrency, CharacterInventoryItem } from '../../model';

  import { ItemDrawer } from '~items/drawer';
  import { MagicItemDrawer } from '~magic-items/drawer';

  import { getInventoryGroups, SHEET_TAB_EMPTY_LABELS } from '../../model';
  import SheetCurrencyRow from './SheetCurrencyRow.vue';
  import SheetInventoryItemRow from './SheetInventoryItemRow.vue';

  const props = defineProps<{
    currency: CharacterCurrency;
    inventory: CharacterInventoryItem[];
  }>();

  const emit = defineEmits<{
    'add-item': [];
    'add-magic-item': [];
    'remove-item': [inventoryItemId: string];
    'adjust-quantity': [inventoryItemId: string, delta: number];
  }>();

  const overlay = useOverlay();

  // Дроверы описаний предметов; без destroyOnClose — повторный open()
  // после закрытия иначе падает («Overlay not found»).
  const itemPreviewDrawer = overlay.create(ItemDrawer, {
    props: {
      url: '',
      onClose: () => itemPreviewDrawer.close(),
    },
  });

  const magicItemPreviewDrawer = overlay.create(MagicItemDrawer, {
    props: {
      url: '',
      onClose: () => magicItemPreviewDrawer.close(),
    },
  });

  /** Открывает дровер раздела-источника предмета. */
  function handlePreview(inventoryItem: CharacterInventoryItem) {
    if (inventoryItem.category === 'MAGIC_ITEM') {
      magicItemPreviewDrawer.open({ url: inventoryItem.url });

      return;
    }

    itemPreviewDrawer.open({ url: inventoryItem.url });
  }

  function handleQuantityAdjust(inventoryItemId: string, delta: number) {
    emit('adjust-quantity', inventoryItemId, delta);
  }

  const displayGroups = computed(() => getInventoryGroups(props.inventory));
</script>

<template>
  <div class="flex flex-col gap-4 pt-2">
    <div class="flex flex-wrap justify-end gap-2">
      <UButton
        icon="tabler:sparkles"
        label="Добавить магический предмет"
        color="neutral"
        variant="ghost"
        size="sm"
        @click.left.exact.prevent="emit('add-magic-item')"
      />

      <UButton
        icon="tabler:plus"
        label="Добавить предмет"
        color="neutral"
        variant="ghost"
        size="sm"
        @click.left.exact.prevent="emit('add-item')"
      />
    </div>

    <SheetCurrencyRow :currency="currency" />

    <template v-if="displayGroups.length">
      <div
        v-for="group in displayGroups"
        :key="group.category"
        class="flex flex-col gap-2"
      >
        <div class="flex items-center gap-2">
          <span
            class="shrink-0 text-[10px] font-bold tracking-wider text-muted uppercase"
          >
            {{ group.title }}
          </span>

          <div class="h-px grow bg-default/50" />
        </div>

        <SheetInventoryItemRow
          v-for="inventoryItem in group.items"
          :key="inventoryItem.id"
          :inventory-item="inventoryItem"
          @preview="handlePreview(inventoryItem)"
          @remove="emit('remove-item', inventoryItem.id)"
          @adjust="(delta) => handleQuantityAdjust(inventoryItem.id, delta)"
        />
      </div>
    </template>

    <div
      v-else
      class="flex h-64 items-center justify-center rounded-lg border border-dashed border-default text-sm text-dimmed"
    >
      {{ SHEET_TAB_EMPTY_LABELS.equipment }}
    </div>
  </div>
</template>
