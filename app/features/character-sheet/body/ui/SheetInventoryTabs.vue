<script setup lang="ts">
  import type { TabsItem } from '@nuxt/ui';

  import type {
    CharacterCurrency,
    CharacterCustomCurrency,
    CharacterFeature,
    CharacterInventoryItem,
    CharacterSpell,
    SheetTab,
    SheetTabSlot,
    SpellcastingBreakdown,
    SpellSlotRow,
  } from '../../model';

  import {
    SHEET_DEFAULT_TAB,
    SHEET_MAIN_TAB,
    SHEET_TABS,
    SHEET_TABS_SCROLL_STEP_RATIO,
  } from '../../model';
  import SheetEquipmentTab from './SheetEquipmentTab.vue';
  import SheetFeaturesTab from './SheetFeaturesTab.vue';
  import SheetNotesTab from './SheetNotesTab.vue';
  import SheetSpellsTab from './SheetSpellsTab.vue';

  const props = defineProps<{
    currency: CharacterCurrency;
    customCurrencies: CharacterCustomCurrency[];
    inventory: CharacterInventoryItem[];
    totalWeight: number;
    carryingCapacity: number;
    features: CharacterFeature[];
    spells: CharacterSpell[];
    spellcasting: SpellcastingBreakdown;

    /** Ячейки заклинаний по кругам; пусто — класс ячеек не даёт. */
    spellSlots: SpellSlotRow[];

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
    'add-custom-item': [];
    'edit-item': [inventoryItemId: string];
    'add-spell': [];
    'add-custom-spell': [];
    'edit-spell': [spellUrl: string];
    'edit-spellcasting': [];
    'edit-currency': [];
    'adjust-item-quantity': [inventoryItemId: string, delta: number];
    'toggle-item-equip': [inventoryItemId: string];
    'roll-item-attack': [inventoryItem: CharacterInventoryItem];
    'roll-item-damage': [inventoryItem: CharacterInventoryItem];
    'edit-feature': [featureId: string];
    'remove-feature': [featureId: string];
    'remove-item': [inventoryItemId: string];
    'remove-spell': [spellUrl: string];
    'toggle-spell-slot': [level: number, index: number];
  }>();

  function handleItemAdd() {
    emit('add-item');
  }

  function handleMagicItemAdd() {
    emit('add-magic-item');
  }

  function handleCustomItemAdd() {
    emit('add-custom-item');
  }

  function handleItemEdit(inventoryItemId: string) {
    emit('edit-item', inventoryItemId);
  }

  function handleCurrencyEdit() {
    emit('edit-currency');
  }

  function handleItemRemove(inventoryItemId: string) {
    emit('remove-item', inventoryItemId);
  }

  function handleItemQuantityAdjust(inventoryItemId: string, delta: number) {
    emit('adjust-item-quantity', inventoryItemId, delta);
  }

  function handleItemEquipToggle(inventoryItemId: string) {
    emit('toggle-item-equip', inventoryItemId);
  }

  function handleItemAttackRoll(inventoryItem: CharacterInventoryItem) {
    emit('roll-item-attack', inventoryItem);
  }

  function handleItemDamageRoll(inventoryItem: CharacterInventoryItem) {
    emit('roll-item-damage', inventoryItem);
  }

  function handleSpellAdd() {
    emit('add-spell');
  }

  function handleCustomSpellAdd() {
    emit('add-custom-spell');
  }

  function handleSpellEdit(spellUrl: string) {
    emit('edit-spell', spellUrl);
  }

  function handleSpellcastingEdit() {
    emit('edit-spellcasting');
  }

  function handleSpellRemove(spellUrl: string) {
    emit('remove-spell', spellUrl);
  }

  function handleSpellSlotToggle(level: number, index: number) {
    emit('toggle-spell-slot', level, index);
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

  // Подписи разделов всегда полные — сокращений нет. Когда ряд не помещается
  // (телефон, узкий drawer/панель), он прокручивается свайпом: обрезанные
  // подписи затеняются маской, а по краям появляются кнопки-стрелки.
  const stripRef = ref<HTMLElement | null>(null);
  const stripContentRef = ref<HTMLElement | null>(null);

  const {
    style: scrollShadowStyle,
    isOverflowing,
    arrivedState,
  } = useScrollShadow(stripRef, { orientation: 'horizontal' });

  const canScrollLeft = computed(
    () => isOverflowing.value && !arrivedState.left,
  );

  const canScrollRight = computed(
    () => isOverflowing.value && !arrivedState.right,
  );

  // `useScrollShadow` пересчитывает состояние только по событию прокрутки, а
  // ширина ленты меняется и без неё: другой размер контейнера, появление
  // вкладки «Основное». Дёргаем событие руками, иначе стрелки и затенение
  // остаются от прежней раскладки. Следим за содержимым ленты — его ширина
  // реагирует на оба случая (`min-w-full` + число вкладок).
  useResizeObserver(stripContentRef, () => {
    stripRef.value?.dispatchEvent(new Event('scroll'));
  });

  /**
   * Прокручивает ленту вкладок на шаг в заданную сторону.
   *
   * @param direction -1 — влево, 1 — вправо.
   */
  function scrollStrip(direction: number) {
    const strip = stripRef.value;

    if (!strip) {
      return;
    }

    strip.scrollBy({
      left: direction * strip.clientWidth * SHEET_TABS_SCROLL_STEP_RATIO,
      behavior: 'smooth',
    });
  }

  /** Прокрутка ленты вкладок влево — кнопка-стрелка у левого края. */
  function handleScrollLeft() {
    scrollStrip(-1);
  }

  /** Прокрутка ленты вкладок вправо — кнопка-стрелка у правого края. */
  function handleScrollRight() {
    scrollStrip(1);
  }

  /**
   * Подтягивает активную вкладку в видимую часть ленты. Двигаем только саму
   * ленту (`scrollBy` у контейнера), чтобы страница под ней не дёргалась.
   */
  function scrollActiveTabIntoView() {
    const strip = stripRef.value;

    const activeTrigger = strip?.querySelector(
      '[data-slot="trigger"][data-state="active"]',
    );

    if (!strip || !activeTrigger) {
      return;
    }

    const stripBox = strip.getBoundingClientRect();
    const triggerBox = activeTrigger.getBoundingClientRect();

    if (triggerBox.left < stripBox.left) {
      strip.scrollBy({ left: triggerBox.left - stripBox.left });
    }

    if (triggerBox.right > stripBox.right) {
      strip.scrollBy({ left: triggerBox.right - stripBox.right });
    }
  }

  const tabs = computed<SheetTab[]>(() =>
    props.hasMainTab ? [SHEET_MAIN_TAB, ...SHEET_TABS] : SHEET_TABS,
  );

  const activeSlot = ref<SheetTabSlot>(
    props.hasMainTab ? SHEET_MAIN_TAB.slot : SHEET_DEFAULT_TAB.slot,
  );

  const tabItems = computed<TabsItem[]>(() =>
    tabs.value.map((tab) => ({ value: tab.slot, label: tab.label })),
  );

  /** Пользователь сам выбрал раздел — раскладка больше его не переключает. */
  const hasUserChoice = ref(false);

  // Вкладка «Основное» появляется и пропадает вместе с раскладкой: в компактной
  // (drawer, панель, телефон) сводка живёт в ней, в широкой — в левой колонке.
  // Пока раздел не выбран вручную, держим активной вкладку по умолчанию, иначе
  // лист в дровере открывался бы сразу на снаряжении или с пустым содержимым.
  // После перерисовки ряда активная вкладка может оказаться за краем ленты —
  // подтягиваем её обратно тем же обработчиком, источник у них общий.
  watch(
    () => props.hasMainTab,
    (hasMainTab) => {
      if (!hasMainTab && activeSlot.value === SHEET_MAIN_TAB.slot) {
        activeSlot.value = SHEET_DEFAULT_TAB.slot;
      }

      if (hasMainTab && !hasUserChoice.value) {
        activeSlot.value = SHEET_MAIN_TAB.slot;
      }

      void nextTick(scrollActiveTabIntoView);
    },
  );

  onMounted(() => {
    void nextTick(scrollActiveTabIntoView);
  });

  // Широкий режим (нет вкладки «Основное») = вкладки стоят в правой колонке сетки
  // рядом с левой сводкой. Тогда высоту блока ограничиваем высотой левой колонки,
  // а содержимое активной вкладки скроллим внутри (лента вкладок остаётся на
  // месте). В компактном режиме высоту не ограничиваем — скроллится вся страница.
  const isWideLayout = computed(() => !props.hasMainTab);

  const rootClass = computed(() =>
    isWideLayout.value ? 'flex h-full min-h-0 flex-col' : undefined,
  );

  // Отступ pt-2 повторяет зазор между лентой вкладок и содержимым, который
  // UTabs давал своим `gap-2` (сейчас контент рендерим сами).
  const contentClass = computed(() =>
    isWideLayout.value ? 'min-h-0 flex-1 overflow-y-auto pt-2' : 'pt-2',
  );

  // Прокрутку при смене вкладки не трогаем: страница остаётся там, где была.
  function handleTabChange(value: string | number) {
    const tab = tabs.value.find((item) => item.slot === value);

    if (tab) {
      hasUserChoice.value = true;
      activeSlot.value = tab.slot;
    }
  }
</script>

<template>
  <div
    class="w-full"
    :class="rootClass"
  >
    <div class="relative shrink-0">
      <div
        ref="stripRef"
        class="hidden-scrollbar overflow-x-auto overscroll-x-contain"
        :style="scrollShadowStyle"
      >
        <div ref="stripContentRef">
          <!-- key по числу вкладок: reka пересчитывает полоску активной вкладки
            только при смене значения и при изменении РАЗМЕРОВ списка/вкладок.
            Появление «Основного» лишь сдвигает активную вкладку вправо, ширины
            не меняются — без перемонтирования полоска осталась бы на месте -->
          <UTabs
            :key="tabItems.length"
            :items="tabItems"
            :model-value="activeSlot"
            :content="false"
            color="warning"
            variant="link"
            :ui="{
              list: 'w-max min-w-full mb-0 self-start',
              trigger: 'shrink-0',
            }"
            @update:model-value="handleTabChange"
          />
        </div>
      </div>

      <!-- Стрелки: и подсказка, что ряд продолжается, и кнопка прокрутки —
        свайп на десктопе недоступен, а на телефоне не всегда очевиден -->
      <Transition name="fade">
        <UButton
          v-if="canScrollLeft"
          icon="tabler:chevron-left"
          color="neutral"
          variant="ghost"
          size="xs"
          square
          class="absolute top-1/2 left-0 z-10 -translate-y-1/2"
          aria-label="Прокрутить вкладки влево"
          @click.left.exact.prevent="handleScrollLeft"
        />
      </Transition>

      <Transition name="fade">
        <UButton
          v-if="canScrollRight"
          icon="tabler:chevron-right"
          color="neutral"
          variant="ghost"
          size="xs"
          square
          class="absolute top-1/2 right-0 z-10 -translate-y-1/2"
          aria-label="Прокрутить вкладки вправо"
          @click.left.exact.prevent="handleScrollRight"
        />
      </Transition>
    </div>

    <div :class="contentClass">
      <div
        v-if="activeSlot === 'main'"
        class="pt-4"
      >
        <slot name="main" />
      </div>

      <SheetEquipmentTab
        v-else-if="activeSlot === 'equipment'"
        :currency="currency"
        :custom-currencies="customCurrencies"
        :inventory="inventory"
        :total-weight="totalWeight"
        :carrying-capacity="carryingCapacity"
        @add-item="handleItemAdd"
        @add-magic-item="handleMagicItemAdd"
        @add-custom-item="handleCustomItemAdd"
        @edit-item="handleItemEdit"
        @edit-currency="handleCurrencyEdit"
        @remove-item="handleItemRemove"
        @adjust-quantity="handleItemQuantityAdjust"
        @toggle-equip="handleItemEquipToggle"
        @roll-attack="handleItemAttackRoll"
        @roll-damage="handleItemDamageRoll"
      />

      <SheetSpellsTab
        v-else-if="activeSlot === 'spells'"
        :spells="spells"
        :spellcasting="spellcasting"
        :spell-slots="spellSlots"
        @add-spell="handleSpellAdd"
        @add-custom-spell="handleCustomSpellAdd"
        @edit-spell="handleSpellEdit"
        @edit-spellcasting="handleSpellcastingEdit"
        @remove-spell="handleSpellRemove"
        @toggle-spell-slot="handleSpellSlotToggle"
      />

      <SheetFeaturesTab
        v-else-if="activeSlot === 'features'"
        :features="features"
        @add-feature="handleFeatureAdd"
        @add-feat="handleFeatAdd"
        @edit-feature="handleFeatureEdit"
        @remove-feature="handleFeatureRemove"
      />

      <SheetNotesTab v-else />
    </div>
  </div>
</template>

<style scoped>
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.2s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
</style>
