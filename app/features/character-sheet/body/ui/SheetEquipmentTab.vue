<script setup lang="ts">
  import type {
    AttunementBreakdown,
    CharacterCurrency,
    CharacterCustomCurrency,
    CharacterInventoryItem,
  } from '../../model';

  import { ACTION_LABELS } from '~/shared/consts';
  import { ConfirmDialog } from '~initiative/ui-kit';
  import { ItemDrawer } from '~items/drawer';
  import { MagicItemDrawer } from '~magic-items/drawer';

  import { useCharacterSheet } from '../../composables';
  import {
    ATTUNEMENT_LABELS,
    CARRYING_CAPACITY_LABELS,
    getAttunementHint,
    getAttunementValue,
    getEquipmentAddMenuItems,
    getInventoryGroups,
    getInventoryRemoveDescription,
    INVENTORY_REMOVE_CONFIRM_LABEL,
    INVENTORY_REMOVE_CONFIRM_TITLE,
    SHEET_HEADER_STAT_CLASS,
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

    /** Разбор предела настройки на магические предметы (плитка шапки). */
    attunement: AttunementBreakdown;
  }>();

  const emit = defineEmits<{
    'add-item': [];
    'add-magic-item': [];
    'add-custom-item': [];
    'edit-item': [inventoryItemId: string];
    'copy-item': [inventoryItemId: string];
    'edit-currency': [];
    'edit-carrying-capacity': [];
    'edit-attunement': [];
    'remove-item': [inventoryItemId: string];
    'adjust-quantity': [inventoryItemId: string, delta: number];
    'toggle-equip': [inventoryItemId: string];
    'toggle-attuned': [inventoryItemId: string];
    'toggle-active': [inventoryItemId: string];
    'spend-charge': [inventoryItemId: string];
    'restore-charges': [inventoryItemId: string];
    'toggle-two-handed': [inventoryItemId: string];
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

  // Удаление подтверждаем: отменить его нечем, а предмет из каталога
  // приходится искать заново. Предмет держим до закрытия диалога, иначе на
  // анимации закрытия описание мигало бы пустым. shallowRef: предмет всегда
  // заменяется целиком, следить за его полями незачем — читаем только название
  // и id.
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

  /** Переносимый вес больше грузоподъёмности: персонаж перегружен. */
  const isOverloaded = computed(
    () => props.totalWeight > props.carryingCapacity,
  );

  // Перегруз виден по цвету: и число, и значок краснеют. Значок красим тоже —
  // в узкой колонке подписи у плитки нет, и он остаётся единственной пометкой
  // того, о каком числе речь.
  const weightValueClass = computed(() =>
    isOverloaded.value ? 'text-error' : 'text-highlighted',
  );

  const weightIconClass = computed(() =>
    isOverloaded.value ? 'text-error' : 'text-muted',
  );

  const attunementValue = computed(() => getAttunementValue(props.attunement));

  const attunementHint = computed(() => getAttunementHint(props.attunement));

  // Настроено больше, чем можно: так бывает после снижения предела или смены
  // характеристики основы — значение об этом предупреждает цветом.
  const attunementValueClass = computed(() =>
    props.attunement.count > props.attunement.value
      ? 'text-error'
      : 'text-highlighted',
  );
</script>

<template>
  <!-- Свой @container: строку веса ужимаем по фактической ширине вкладки, а не
    окна — в дровере и правой панели лист бывает узким и на широком экране -->
  <div class="@container flex flex-col gap-4 pt-2">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="flex flex-wrap items-center gap-2">
        <!-- Переносимый вес — такая же плитка-кнопка настройки, как числа
          заклинательства и подготовки в шапке вкладки заклинаний: на
          интерактивность указывает потепление рамки, поэтому карандаш плитке не
          нужен -->
        <UTooltip :text="CARRYING_CAPACITY_LABELS.statHint">
          <button
            type="button"
            :class="SHEET_HEADER_STAT_CLASS"
            :aria-label="CARRYING_CAPACITY_LABELS.open"
            @click.left.exact.prevent="emit('edit-carrying-capacity')"
          >
            <span class="flex items-center gap-1.5">
              <!-- В узкой колонке подпись занимает больше места, чем само
                число, и уступает значку: рядом стоит кнопка «Добавить», а от
                полного названия ряд переносится на две строки. Название
                остаётся в подсказке плитки -->
              <UIcon
                name="tabler:weight"
                class="size-4 shrink-0 @lg:hidden"
                :class="weightIconClass"
              />

              <span
                class="hidden text-[10px] font-bold tracking-wider text-muted uppercase @lg:inline"
              >
                {{ CARRYING_CAPACITY_LABELS.stat }}
              </span>

              <span
                class="text-xs font-bold whitespace-nowrap"
                :class="weightValueClass"
              >
                {{ totalWeight }} / {{ carryingCapacity }}
                {{ WEIGHT_UNIT_LABEL }}
              </span>
            </span>
          </button>
        </UTooltip>

        <!-- Настройка на предметы: сколько настроено из предела. По правилам
          2024 предел — три предмета, но лист даёт задать своё число или считать
          его от характеристики, поэтому плитка ведёт в ту же настройку, что и
          вес -->
        <UTooltip :text="attunementHint">
          <button
            type="button"
            :class="SHEET_HEADER_STAT_CLASS"
            :aria-label="ATTUNEMENT_LABELS.open"
            @click.left.exact.prevent="emit('edit-attunement')"
          >
            <span class="flex items-center gap-1.5">
              <UIcon
                :name="ATTUNEMENT_LABELS.icon"
                class="size-4 shrink-0 text-muted @lg:hidden"
              />

              <span
                class="hidden text-[10px] font-bold tracking-wider text-muted uppercase @lg:inline"
              >
                {{ ATTUNEMENT_LABELS.stat }}
              </span>

              <span
                class="text-xs font-bold whitespace-nowrap"
                :class="attunementValueClass"
              >
                {{ attunementValue }}
              </span>
            </span>
          </button>
        </UTooltip>
      </div>

      <UDropdownMenu
        :items="addMenuItems"
        :content="{ align: 'end' }"
      >
        <UButton
          icon="tabler:plus"
          :label="ACTION_LABELS.add"
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
          @copy="emit('copy-item', inventoryItem.id)"
          @remove="handleRemoveRequest(inventoryItem)"
          @adjust="(delta) => handleQuantityAdjust(inventoryItem.id, delta)"
          @toggle-equip="emit('toggle-equip', inventoryItem.id)"
          @toggle-attuned="emit('toggle-attuned', inventoryItem.id)"
          @toggle-active="emit('toggle-active', inventoryItem.id)"
          @spend-charge="emit('spend-charge', inventoryItem.id)"
          @restore-charges="emit('restore-charges', inventoryItem.id)"
          @toggle-two-handed="emit('toggle-two-handed', inventoryItem.id)"
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
