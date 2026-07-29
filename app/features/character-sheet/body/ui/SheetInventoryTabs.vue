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
    SHEET_TABS_AXIS_LOCK_THRESHOLD,
    SHEET_TABS_DRAG_DEADZONE,
    SHEET_TABS_DRAG_FADE_SPAN,
    SHEET_TABS_DRAG_MAX_FADE,
    SHEET_TABS_DRAG_RESISTANCE,
    SHEET_TABS_OVERFLOW_EPSILON,
    SHEET_TABS_SCROLL_EDGE_GAP,
    SHEET_TABS_SCROLL_EPSILON,
    SHEET_TABS_SCROLL_STEP_RATIO,
    SHEET_TABS_SWIPE_THRESHOLD,
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
    innateSpells: CharacterSpell[];
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
    'copy-item': [inventoryItemId: string];
    'add-spell': [];
    'add-custom-spell': [];
    'edit-spell': [spellUrl: string];
    'copy-spell': [spellUrl: string];
    'edit-spellcasting': [];
    'edit-prepared-spells': [];
    'edit-currency': [];
    'adjust-item-quantity': [inventoryItemId: string, delta: number];
    'toggle-item-equip': [inventoryItemId: string];
    'roll-item-attack': [inventoryItem: CharacterInventoryItem];
    'roll-item-damage': [inventoryItem: CharacterInventoryItem];
    'edit-feature': [featureId: string];
    'remove-feature': [featureId: string];
    'add-note': [];
    'edit-note': [noteId: string];
    'remove-note': [noteId: string];
    'remove-item': [inventoryItemId: string];
    'remove-spell': [spellUrl: string];
    'copy-innate-spell': [spellUrl: string];
    'remove-innate-spell': [spellUrl: string];
    'roll-spell-damage': [formula: string, spellLevel: number];
    'toggle-spell-prepared': [spellUrl: string];
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

  function handleItemCopy(inventoryItemId: string) {
    emit('copy-item', inventoryItemId);
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

  function handleSpellCopy(spellUrl: string) {
    emit('copy-spell', spellUrl);
  }

  function handleSpellcastingEdit() {
    emit('edit-spellcasting');
  }

  function handlePreparedSpellsEdit() {
    emit('edit-prepared-spells');
  }

  function handleSpellRemove(spellUrl: string) {
    emit('remove-spell', spellUrl);
  }

  function handleInnateSpellCopy(spellUrl: string) {
    emit('copy-innate-spell', spellUrl);
  }

  function handleInnateSpellRemove(spellUrl: string) {
    emit('remove-innate-spell', spellUrl);
  }

  function handleSpellDamageRoll(formula: string, spellLevel: number) {
    emit('roll-spell-damage', formula, spellLevel);
  }

  function handleSpellPreparedToggle(spellUrl: string) {
    emit('toggle-spell-prepared', spellUrl);
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

  function handleNoteAdd() {
    emit('add-note');
  }

  function handleNoteEdit(noteId: string) {
    emit('edit-note', noteId);
  }

  function handleNoteRemove(noteId: string) {
    emit('remove-note', noteId);
  }

  // Подписи разделов всегда полные — сокращений нет. Когда ряд не помещается
  // (телефон, узкий drawer/панель), он прокручивается свайпом: обрезанные
  // подписи затеняются маской, а по краям появляются кнопки-стрелки.
  const stripRef = ref<HTMLElement | null>(null);
  const stripContentRef = ref<HTMLElement | null>(null);

  const { style: scrollShadowStyle } = useScrollShadow(stripRef, {
    orientation: 'horizontal',
  });

  // Позицию ленты держим сами: `arrivedState` из `useScrollShadow` требует
  // ровного нуля и ровного края, а прокрутка оставляет доли пикселя — стрелка
  // «влево» продолжала висеть над первой вкладкой, а «вправо» не давала
  // досмотреть последнюю.
  const stripScroll = reactive({ left: 0, max: 0 });

  /** Перечитывает позицию ленты и остаток прокрутки для стрелок. */
  function updateStripScroll() {
    const strip = stripRef.value;

    if (!strip) {
      return;
    }

    stripScroll.left = strip.scrollLeft;
    stripScroll.max = strip.scrollWidth - strip.clientWidth;
  }

  const canScrollLeft = computed(
    () => stripScroll.left > SHEET_TABS_SCROLL_EPSILON,
  );

  const canScrollRight = computed(
    () => stripScroll.left < stripScroll.max - SHEET_TABS_SCROLL_EPSILON,
  );

  useEventListener(stripRef, 'scroll', updateStripScroll, { passive: true });

  // Ширина ленты меняется и без прокрутки: другой размер контейнера, появление
  // вкладки «Основное». Пересчитываем метрики сами, а событие прокрутки дёргаем
  // для маски затенения — она живёт внутри `useScrollShadow`. Следим за
  // содержимым ленты: его ширина реагирует на оба случая (`min-w-full`).
  useResizeObserver(stripContentRef, () => {
    updateStripScroll();
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
   * ленту, чтобы страница под ней не дёргалась. Крайние вкладки доводим ровно
   * до края: остаток в доли пикселя оставлял бы стрелку зажжённой поверх
   * подписи. Остальные — с зазором под стрелку, иначе она ложится на подпись.
   *
   * @param behavior `smooth` — переключение вкладки пользователем, за ним видно
   *   движение ленты; `auto` — установка ленты на место (открытие листа, смена
   *   раскладки), её показывать нечего: лист должен появляться уже собранным.
   */
  function scrollActiveTabIntoView(behavior: 'auto' | 'smooth' = 'smooth') {
    const strip = stripRef.value;

    if (!strip) {
      return;
    }

    const triggers = [...strip.querySelectorAll('[data-slot="trigger"]')];

    const activeIndex = triggers.findIndex(
      (trigger) => trigger.getAttribute('data-state') === 'active',
    );

    const activeTrigger = triggers[activeIndex];

    if (!activeTrigger) {
      return;
    }

    if (activeIndex === 0) {
      strip.scrollTo({ left: 0, behavior });

      return;
    }

    if (activeIndex === triggers.length - 1) {
      strip.scrollTo({
        left: strip.scrollWidth - strip.clientWidth,
        behavior,
      });

      return;
    }

    const stripBox = strip.getBoundingClientRect();
    const triggerBox = activeTrigger.getBoundingClientRect();

    if (triggerBox.left < stripBox.left + SHEET_TABS_SCROLL_EDGE_GAP) {
      strip.scrollBy({
        left: triggerBox.left - stripBox.left - SHEET_TABS_SCROLL_EDGE_GAP,
        behavior,
      });

      return;
    }

    if (triggerBox.right > stripBox.right - SHEET_TABS_SCROLL_EDGE_GAP) {
      strip.scrollBy({
        left: triggerBox.right - stripBox.right + SHEET_TABS_SCROLL_EDGE_GAP,
        behavior,
      });
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

  /**
   * Анимация смены раздела. `tab-forward`/`tab-backward` — переключение самим
   * пользователем: уходящий раздел уезжает в сторону (вперёд по ленте — влево,
   * назад — вправо), приезжающий не едет следом, а проявляется. `tab-none` —
   * программная подмена при смене раскладки: CSS-правил у имени нет, переход
   * получает нулевую длительность, и раздел меняется без видимой анимации.
   * Иначе при открытии дровера на десктопе лист «мерцал»: вкладка «Основное»
   * появляется сразу после первого замера контейнера, и её содержимое въезжало
   * с анимацией. Отключать анимацию через `:css="false"` нельзя: без JS-хуков
   * `done` у leave вызывается синхронно прямо в размонтировании, `mode="out-in"`
   * перезапускает рендер посреди патча — и приходящий раздел вовсе не
   * монтируется (контент пропадает).
   */
  const tabTransition = ref<'tab-forward' | 'tab-backward' | 'tab-none'>(
    'tab-none',
  );

  // Вкладка «Основное» появляется и пропадает вместе с раскладкой: в компактной
  // (drawer, панель, телефон) сводка живёт в ней, в широкой — в левой колонке.
  // Пока раздел не выбран вручную, держим активной вкладку по умолчанию, иначе
  // лист в дровере открывался бы сразу на снаряжении или с пустым содержимым.
  // После перерисовки ряда активная вкладка может оказаться за краем ленты —
  // подтягиваем её обратно тем же обработчиком, источник у них общий.
  watch(
    () => props.hasMainTab,
    (hasMainTab) => {
      // Подмена раздела здесь — не жест пользователя: без анимации.
      tabTransition.value = 'tab-none';

      if (!hasMainTab && activeSlot.value === SHEET_MAIN_TAB.slot) {
        activeSlot.value = SHEET_DEFAULT_TAB.slot;
      }

      if (hasMainTab && !hasUserChoice.value) {
        activeSlot.value = SHEET_MAIN_TAB.slot;
      }

      // Смена раскладки — не выбор пользователя: ленту ставим на место разом.
      // В дровере она случается сразу после открытия (контейнер измеряется уже
      // на клиенте), и плавная прокрутка читалась бы как «лист доезжает».
      void nextTick(() => scrollActiveTabIntoView('auto'));
    },
  );

  onMounted(() => {
    void nextTick(() => scrollActiveTabIntoView('auto'));
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

  /**
   * Переключение раздела самим пользователем — вкладкой или свайпом. Прокрутку
   * страницы не трогаем: она остаётся там, где была; двигается только лента,
   * чтобы выбранная вкладка не осталась за её краем.
   */
  function selectTab(slot: SheetTabSlot) {
    const currentIndex = tabs.value.findIndex(
      (tab) => tab.slot === activeSlot.value,
    );

    const nextIndex = tabs.value.findIndex((tab) => tab.slot === slot);

    tabTransition.value =
      nextIndex > currentIndex ? 'tab-forward' : 'tab-backward';

    hasUserChoice.value = true;
    activeSlot.value = slot;

    void nextTick(scrollActiveTabIntoView);
  }

  /**
   * Выбор раздела кликом по ленте вкладок.
   *
   * @param value Значение вкладки из `UTabs` — слот раздела.
   */
  function handleTabChange(value: string | number) {
    const tab = tabs.value.find((item) => item.slot === value);

    if (tab) {
      selectTab(tab.slot);
    }
  }

  /**
   * Соседний раздел ленты или `undefined`, если дальше край: зацикливание сбивает
   * ощущение места в списке разделов.
   *
   * @param step -1 — предыдущий раздел, 1 — следующий.
   */
  function getAdjacentTab(step: number): SheetTab | undefined {
    const currentIndex = tabs.value.findIndex(
      (tab) => tab.slot === activeSlot.value,
    );

    return tabs.value[currentIndex + step];
  }

  /** Переключает на соседний раздел; по краям ленты жест ничего не делает. */
  function shiftTab(step: number) {
    const nextTab = getAdjacentTab(step);

    if (!nextTab) {
      return;
    }

    selectTab(nextTab.slot);
  }

  /**
   * Проверяет, обрабатывает ли жест сам элемент под пальцем: поля ввода,
   * редактор заметок и блоки с горизонтальной прокруткой (широкая таблица в
   * разметке) — свайп по ним листать разделы не должен.
   *
   * @param target Элемент, на котором начался жест.
   * @param root Контейнер содержимого раздела — до него идёт проверка.
   */
  function isGestureOwnedByContent(
    target: EventTarget | null,
    root: HTMLElement | null,
  ): boolean {
    let element = target instanceof Element ? target : null;

    while (element && element !== root) {
      if (element.matches('input, textarea, select, [contenteditable]')) {
        return true;
      }

      const { overflowX } = window.getComputedStyle(element);

      const canScrollX =
        overflowX === 'auto'
        || overflowX === 'scroll'
        || overflowX === 'overlay';

      if (
        canScrollX
        && element.scrollWidth
          > element.clientWidth + SHEET_TABS_OVERFLOW_EPSILON
      ) {
        return true;
      }

      element = element.parentElement;
    }

    return false;
  }

  // Свайп по самому содержимому листает разделы: на телефоне это привычнее, чем
  // целиться в узкую ленту вкладок. Жест ведём сами, а не через `useSwipe`:
  // тому нужен пассивный слушатель (страницу под пальцем не удержать) либо
  // `passive: false`, который глушит прокрутку с первого же касания. Нам нужна
  // середина — ось выбирается на первых пикселях, и только горизонтальный жест
  // забирает событие себе.
  const contentRef = ref<HTMLElement | null>(null);

  /** Ось жеста: пока `none` — решаем, чей он, вертикальный отдаём странице. */
  type GestureAxis = 'none' | 'horizontal' | 'vertical';

  let gestureAxis: GestureAxis = 'none';
  let gestureStartX = 0;
  let gestureStartY = 0;

  /** Жест начался на элементе, который обрабатывает свайп сам. */
  let isSwipeIgnored = false;

  /** Сдвиг раздела под пальцем (px) и прозрачность на этом сдвиге. */
  const dragOffset = ref(0);
  const dragOpacity = ref(1);

  /** Палец отпущен: сдвиг доигрывает переходом, а не следует за пальцем. */
  const isDragSettling = ref(false);

  // Позицию и затухание отдаём в CSS переменными: класс перехода Vue объявлен
  // ниже них и перебивает обе величины, поэтому уход в сторону доигрывает
  // ровно с той точки, где палец отпустили.
  const paneStyle = computed(() => ({
    '--tab-drag-x': `${dragOffset.value}px`,
    '--tab-drag-opacity': `${dragOpacity.value}`,
  }));

  /**
   * Ведёт раздел за пальцем: контент отъезжает в сторону жеста и гаснет. У края
   * ленты, где листать некуда, сдвиг гасится сопротивлением и без затухания —
   * жест видно, но он ничем не закончится.
   *
   * @param deltaX Путь пальца по горизонтали; меньше нуля — палец идёт влево.
   */
  function updateDragOffset(deltaX: number) {
    const width = contentRef.value?.clientWidth ?? 0;

    // Дальше своей ширины раздел не уезжает: иначе уход в сторону (ровно −100%)
    // доигрывал бы назад, к пальцу.
    const distance = Math.min(
      Math.abs(deltaX) - SHEET_TABS_DRAG_DEADZONE,
      width,
    );

    if (width <= 0 || distance <= 0) {
      dragOffset.value = 0;
      dragOpacity.value = 1;

      return;
    }

    const step = deltaX < 0 ? 1 : -1;
    const hasTarget = Boolean(getAdjacentTab(step));

    dragOffset.value =
      -step * distance * (hasTarget ? 1 : SHEET_TABS_DRAG_RESISTANCE);

    const progress = Math.min(
      1,
      distance / (width * SHEET_TABS_DRAG_FADE_SPAN),
    );

    dragOpacity.value = hasTarget ? 1 - progress * SHEET_TABS_DRAG_MAX_FADE : 1;
  }

  /**
   * Палец отпущен (или жест прерван системой): сдвиг снимается с переходом.
   * Переключился раздел — уходящий доигрывает уход в сторону от этой же точки,
   * не переключился — содержимое возвращается на место.
   */
  function handleSwipeSettle() {
    // Обычное касание и вертикальная прокрутка содержимое не сдвигают —
    // возвращать нечего.
    if (dragOffset.value === 0) {
      return;
    }

    isDragSettling.value = true;
    dragOffset.value = 0;
    dragOpacity.value = 1;
  }

  /**
   * Начало касания: запоминаем точку отсчёта и решаем, наш ли это жест вообще.
   * Мультитач — это масштабирование, его не перехватываем.
   */
  function handleTouchStart(event: TouchEvent) {
    const touch = event.touches[0];

    isSwipeIgnored =
      !touch
      || event.touches.length > 1
      || isGestureOwnedByContent(event.target, contentRef.value);

    gestureAxis = 'none';
    isDragSettling.value = false;

    if (!touch) {
      return;
    }

    gestureStartX = touch.clientX;
    gestureStartY = touch.clientY;
  }

  /**
   * Движение пальца: выбирает ось жеста и ведёт раздел, если ось наша.
   */
  function handleTouchMove(event: TouchEvent) {
    const touch = event.touches[0];

    if (isSwipeIgnored || !touch) {
      return;
    }

    const deltaX = touch.clientX - gestureStartX;
    const deltaY = touch.clientY - gestureStartY;

    // Ось выбираем на первых же пикселях: дальше браузер решает сам, начал
    // прокрутку — и отменить её уже нельзя, событие приходит непрерываемым.
    if (gestureAxis === 'none') {
      if (
        Math.max(Math.abs(deltaX), Math.abs(deltaY))
        < SHEET_TABS_AXIS_LOCK_THRESHOLD
      ) {
        return;
      }

      gestureAxis =
        Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical';
    }

    // Вертикаль — прокрутка страницы, в неё не вмешиваемся.
    if (gestureAxis === 'vertical') {
      return;
    }

    // Жест наш: страница под пальцем стоит, иначе её тянет вертикальным
    // дрейфом пальца и лист дёргается прямо во время листания.
    if (event.cancelable) {
      event.preventDefault();
    }

    updateDragOffset(deltaX);
  }

  /**
   * Палец отпущен: раздел снимается со сдвига, а дотянувший до порога жест
   * переключает вкладку.
   */
  function handleTouchEnd(event: TouchEvent) {
    const wasHorizontal = gestureAxis === 'horizontal' && !isSwipeIgnored;

    gestureAxis = 'none';
    handleSwipeSettle();

    const touch = event.changedTouches[0];

    if (!wasHorizontal || !touch) {
      return;
    }

    const deltaX = touch.clientX - gestureStartX;

    if (Math.abs(deltaX) < SHEET_TABS_SWIPE_THRESHOLD) {
      return;
    }

    // Палец влево — следующий раздел, как при листании ленты.
    shiftTab(deltaX < 0 ? 1 : -1);
  }

  /** Жест прерван системой (звонок, шторка) — раздел просто возвращается. */
  function handleTouchCancel() {
    gestureAxis = 'none';
    handleSwipeSettle();
  }

  // touchmove слушаем активно: только так работает `preventDefault`. Остальные
  // события ничего не отменяют и остаются пассивными.
  useEventListener(contentRef, 'touchstart', handleTouchStart, {
    passive: true,
  });

  useEventListener(contentRef, 'touchmove', handleTouchMove, {
    passive: false,
  });

  useEventListener(contentRef, 'touchend', handleTouchEnd, { passive: true });

  useEventListener(contentRef, 'touchcancel', handleTouchCancel, {
    passive: true,
  });

  /**
   * Высота уходящего раздела: держит блок, пока приходящий не встал на место.
   * Без неё содержимое на кадр схлопывается в ноль, браузер подтягивает
   * прокрутку под укоротившуюся страницу — и лента вкладок дёргается вверх.
   */
  const paneMinHeight = ref('');

  /**
   * Запоминает высоту уходящего раздела перед его удалением.
   *
   * @param element Корень уходящего раздела.
   */
  function handlePaneBeforeLeave(element: Element) {
    paneMinHeight.value = `${element.getBoundingClientRect().height}px`;
  }

  /** Приходящий раздел встал на место — держать высоту больше не нужно. */
  function handlePaneAfterEnter() {
    paneMinHeight.value = '';
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

    <!-- overflow-x-clip (не hidden): обрезает уезжающий раздел, но не делает
      блок горизонтальным скролл-контейнером и не ломает прокрутку по вертикали
      в широком режиме -->
    <div
      ref="contentRef"
      class="tab-content overflow-x-clip"
      :class="contentClass"
      :style="{ minHeight: paneMinHeight }"
    >
      <!-- Ключ по разделу: смена вкладки = смена узла, поэтому уходящий раздел
        успевает уехать в сторону, а приходящий появляется уже на его месте -->
      <Transition
        :name="tabTransition"
        mode="out-in"
        @before-leave="handlePaneBeforeLeave"
        @after-enter="handlePaneAfterEnter"
      >
        <div
          :key="activeSlot"
          class="tab-pane"
          :class="{ 'tab-pane--settling': isDragSettling }"
          :style="paneStyle"
        >
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
            @copy-item="handleItemCopy"
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
            :innate-spells="innateSpells"
            :spellcasting="spellcasting"
            :spell-slots="spellSlots"
            @add-spell="handleSpellAdd"
            @add-custom-spell="handleCustomSpellAdd"
            @edit-spell="handleSpellEdit"
            @copy-spell="handleSpellCopy"
            @edit-spellcasting="handleSpellcastingEdit"
            @edit-prepared-spells="handlePreparedSpellsEdit"
            @remove-spell="handleSpellRemove"
            @copy-innate-spell="handleInnateSpellCopy"
            @remove-innate-spell="handleInnateSpellRemove"
            @roll-spell-damage="handleSpellDamageRoll"
            @toggle-spell-prepared="handleSpellPreparedToggle"
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

          <SheetNotesTab
            v-else
            @add-note="handleNoteAdd"
            @edit-note="handleNoteEdit"
            @remove-note="handleNoteRemove"
          />
        </div>
      </Transition>
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

  /* Подмена раздела меняет высоту страницы, и браузер «якорит» прокрутку —
     из-за этого лента вкладок дёргалась вверх на пару пикселей */
  .tab-content {
    overflow-anchor: none;
  }

  /* Раздел едет за пальцем и гаснет: величины приходят переменными из скрипта.
     Правила переходов ниже — они перебивают позицию пальца, поэтому уход в
     сторону доигрывает с той точки, где палец отпустили */
  .tab-pane {
    transform: translateX(var(--tab-drag-x, 0));
    opacity: var(--tab-drag-opacity, 1);
  }

  /* Палец отпущен, а переключения не вышло — раздел возвращается на место */
  .tab-pane--settling {
    transition:
      transform 0.2s ease-out,
      opacity 0.2s ease-out;
  }

  /* Уходит только текущий раздел — уезжает в сторону свайпа и гаснет.
     Следующий не едет следом, а проявляется уже на месте. У `tab-none` правил
     нет намеренно: нулевая длительность = мгновенная подмена раздела при смене
     раскладки (см. `tabTransition`) */
  .tab-forward-leave-active,
  .tab-backward-leave-active {
    transition:
      transform 0.18s ease-in,
      opacity 0.18s ease-in;
  }

  .tab-forward-leave-to {
    transform: translateX(-100%);
    opacity: 0;
  }

  .tab-backward-leave-to {
    transform: translateX(100%);
    opacity: 0;
  }

  .tab-forward-enter-active,
  .tab-backward-enter-active {
    transition: opacity 0.15s ease-out;
  }

  .tab-forward-enter-from,
  .tab-backward-enter-from {
    opacity: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    .tab-forward-leave-active,
    .tab-backward-leave-active,
    .tab-forward-enter-active,
    .tab-backward-enter-active {
      transition: none;
    }
  }
</style>
