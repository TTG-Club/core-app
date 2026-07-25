<script setup lang="ts">
  import type {
    CharacterCurrency,
    CharacterCustomCurrency,
    CharacterInventoryItem,
  } from '../../model';

  import { ConfirmDialog } from '~initiative/ui-kit';
  import { ItemDrawer } from '~items/drawer';
  import { MagicItemDrawer } from '~magic-items/drawer';

  import { useCharacterSheet } from '../../composables';
  import {
    getEquipmentAddMenuItems,
    getInventoryGroups,
    getInventoryRemoveDescription,
    INVENTORY_REMOVE_CONFIRM_LABEL,
    INVENTORY_REMOVE_CONFIRM_TITLE,
    SHEET_TAB_EMPTY_LABELS,
    WEIGHT_UNIT_LABEL,
  } from '../../model';
  import SheetCurrencyRow from './SheetCurrencyRow.vue';
  import SheetInventoryItemRow from './SheetInventoryItemRow.vue';

  const props = defineProps<{
    currency: CharacterCurrency;
    customCurrencies: CharacterCustomCurrency[];
    inventory: CharacterInventoryItem[];
    totalWeight: number;
    carryingCapacity: number;
  }>();

  const emit = defineEmits<{
    'add-item': [];
    'add-magic-item': [];
    'add-custom-item': [];
    'edit-item': [inventoryItemId: string];
    'edit-currency': [];
    'remove-item': [inventoryItemId: string];
    'adjust-quantity': [inventoryItemId: string, delta: number];
    'toggle-equip': [inventoryItemId: string];
    'roll-attack': [inventoryItem: CharacterInventoryItem];
    'roll-damage': [inventoryItem: CharacterInventoryItem];
  }>();

  // Пополнение снаряжения — правка листа: у запертого и у чужого листа кнопка
  // «Добавить» прячется, а ряд с переносимым весом остаётся прежним.
  const { editControlClass } = useCharacterSheet();

  const addMenuItems = getEquipmentAddMenuItems({
    onAddItem: () => emit('add-item'),
    onAddMagicItem: () => emit('add-magic-item'),
    onAddCustomItem: () => emit('add-custom-item'),
  });

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

  // Удаление подтверждаем: кнопка стоит вплотную к «+/−», отменить её нечем, а
  // на узкой карточке она видна всегда — попасть по ней случайно легко. Предмет
  // держим до закрытия диалога, иначе на анимации закрытия описание мигало бы
  // пустым. shallowRef: предмет всегда заменяется целиком, следить за его
  // полями незачем — читаем только название и id.
  const removalItem = shallowRef<CharacterInventoryItem | null>(null);

  const isRemoveOpen = ref(false);

  const removeDescription = computed(() =>
    removalItem.value
      ? getInventoryRemoveDescription(removalItem.value.name)
      : '',
  );

  /**
   * Спрашивает подтверждение удаления: предмет пока остаётся в снаряжении.
   *
   * @param inventoryItem предмет, который просят убрать.
   */
  function handleRemoveRequest(inventoryItem: CharacterInventoryItem) {
    removalItem.value = inventoryItem;
    isRemoveOpen.value = true;
  }

  /** Убирает подтверждённый предмет из снаряжения и закрывает диалог. */
  function handleRemoveConfirm() {
    if (removalItem.value) {
      emit('remove-item', removalItem.value.id);
    }

    isRemoveOpen.value = false;
  }

  const displayGroups = computed(() => getInventoryGroups(props.inventory));

  // Красный при перегрузе (переносимый вес больше грузоподъёмности), иначе
  // приглушённый — как у прочих статусных подписей листа.
  const weightColorClass = computed(() =>
    props.totalWeight > props.carryingCapacity ? 'text-error' : 'text-muted',
  );
</script>

<template>
  <!-- Свой @container: строку веса ужимаем по фактической ширине вкладки, а не
    окна — в дровере и правой панели лист бывает узким и на широком экране -->
  <div class="@container flex flex-col gap-4 pt-2">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div
        class="flex items-center gap-1.5 text-sm"
        :class="weightColorClass"
      >
        <UIcon
          name="tabler:weight"
          class="size-4 shrink-0"
        />

        <span>
          <!-- В узкой колонке от подписи остаётся одно «Вес»: рядом стоит
            кнопка «Добавить», и полный вариант переносит ряд на две строки.
            Двоеточие входит в обе подписи — тогда пробел между ними ни на что
            не влияет, какой бы вариант ни был скрыт -->
          <span class="hidden @md:inline">Переносимый вес:</span>

          <span class="@md:hidden">Вес:</span>

          {{ totalWeight }} / {{ carryingCapacity }} {{ WEIGHT_UNIT_LABEL }}
        </span>
      </div>

      <UDropdownMenu
        :items="addMenuItems"
        :content="{ align: 'end' }"
      >
        <UButton
          icon="tabler:plus"
          label="Добавить"
          trailing-icon="tabler:chevron-down"
          color="neutral"
          variant="ghost"
          size="sm"
          :class="editControlClass"
        />
      </UDropdownMenu>
    </div>

    <SheetCurrencyRow
      :currency="currency"
      :custom-currencies="customCurrencies"
      @edit="emit('edit-currency')"
    />

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
          @edit="emit('edit-item', inventoryItem.id)"
          @remove="handleRemoveRequest(inventoryItem)"
          @adjust="(delta) => handleQuantityAdjust(inventoryItem.id, delta)"
          @toggle-equip="emit('toggle-equip', inventoryItem.id)"
          @roll-attack="emit('roll-attack', inventoryItem)"
          @roll-damage="emit('roll-damage', inventoryItem)"
        />
      </div>
    </template>

    <div
      v-else
      class="flex h-64 items-center justify-center rounded-lg border border-dashed border-default text-sm text-dimmed"
    >
      {{ SHEET_TAB_EMPTY_LABELS.equipment }}
    </div>

    <ConfirmDialog
      v-model:open="isRemoveOpen"
      :title="INVENTORY_REMOVE_CONFIRM_TITLE"
      :description="removeDescription"
      :confirm-label="INVENTORY_REMOVE_CONFIRM_LABEL"
      confirm-color="error"
      confirm-icon="tabler:trash"
      @confirm="handleRemoveConfirm"
    />
  </div>
</template>
