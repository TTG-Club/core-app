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
    'edit-feature': [featureId: string];
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

  function handleFeatureEdit(featureId: string) {
    emit('edit-feature', featureId);
  }

  function handleFeatureRemove(featureId: string) {
    emit('remove-feature', featureId);
  }

  // Короткие подписи подставляем по фактической ширине РЯДА ВКЛАДОК (а не
  // вьюпорта): в узком drawer/панели полные подписи режутся многоточием, поэтому
  // переключаемся на аббревиатуры раньше — как только места становится мало.
  // До первого измерения (ширина 0) ориентируемся на вьюпорт.
  const { isMdOrGreater } = useBreakpoints();
  const tabsRef = ref<HTMLElement | null>(null);
  const { width: tabsWidth } = useElementSize(tabsRef);

  // Порог перехода на короткие подписи зависит от числа вкладок. С вкладкой
  // «Основное» (компакт/drawer — 5 вкладок) полные подписи требуют больше места,
  // поэтому аббревиатуры включаются раньше. Без неё (широкий режим — 4 вкладки)
  // полные подписи помещаются даже на узкой половине колонки (~636px на Full HD),
  // поэтому порог ниже — аббревиатуры там не нужны.
  const tabsShortThreshold = computed(() => (props.hasMainTab ? 680 : 580));

  const useShort = computed(() =>
    tabsWidth.value > 0
      ? tabsWidth.value < tabsShortThreshold.value
      : !isMdOrGreater.value,
  );

  const tabItems = computed<TabsItem[]>(() => {
    const items = SHEET_TABS.map((tab) => {
      const base = useShort.value ? tab.shortLabel : tab.label;

      // Подсчёт веса на вкладке снаряжения показываем всегда — даже в коротком
      // режиме подпись становится «Снар. (0 / 150 фнт)», а не голой аббревиатурой.
      return {
        slot: tab.slot,
        label:
          tab.slot === 'equipment'
            ? `${base} (${props.totalWeight} / ${props.carryingCapacity} ${WEIGHT_UNIT_LABEL})`
            : base,
      };
    });

    return props.hasMainTab
      ? [
          {
            slot: SHEET_MAIN_TAB.slot,
            label: useShort.value
              ? SHEET_MAIN_TAB.shortLabel
              : SHEET_MAIN_TAB.label,
          },
          ...items,
        ]
      : items;
  });

  // Широкий режим (нет вкладки «Основное») = вкладки стоят в правой колонке сетки
  // рядом с левой сводкой. Тогда высоту блока ограничиваем высотой левой колонки,
  // а содержимое активной вкладки скроллим внутри (полоса вкладок остаётся на
  // месте). В компактном режиме высоту не ограничиваем — скроллится вся страница.
  const isWideLayout = computed(() => !props.hasMainTab);

  const tabsUi = computed(() =>
    isWideLayout.value
      ? {
          list: 'shrink-0',
          content: 'min-h-0 flex-1 overflow-y-auto',
        }
      : undefined,
  );
</script>

<template>
  <div
    ref="tabsRef"
    class="w-full"
    :class="isWideLayout && 'flex h-full min-h-0 flex-col'"
  >
    <UTabs
      :items="tabItems"
      color="warning"
      variant="link"
      class="w-full"
      :class="isWideLayout && 'min-h-0 flex-1'"
      :ui="tabsUi"
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
          @edit-feature="handleFeatureEdit"
          @remove-feature="handleFeatureRemove"
        />
      </template>

      <template #notes>
        <SheetNotesTab />
      </template>
    </UTabs>
  </div>
</template>
