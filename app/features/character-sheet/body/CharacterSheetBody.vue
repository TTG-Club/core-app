<script setup lang="ts">
  import type {
    AbilityKey,
    CharacterInventoryItem,
    ProficiencyGroupKey,
    SavingThrowRow,
    SkillRow,
  } from '../model';

  import { useDiceRollHandler } from '~dice-roller/composables';
  import { ConfirmDialog } from '~initiative/ui-kit';

  import {
    useCharacterSheet,
    useCharacterSheetList,
    useCharacterSheetPdf,
    useCharacterSheetSaved,
    useCharacterSheetSaveStatus,
    useCharacterSheetShare,
  } from '../composables';
  import {
    ABILITY_LABELS,
    ARMOR_PROFICIENCY_GROUPS,
    getWeaponAttackBonus,
    getWeaponDamage,
    LANGUAGE_PROFICIENCY_GROUPS,
    TOOL_PROFICIENCY_GROUPS,
  } from '../model';
  import {
    SheetAbilitiesRow,
    SheetAbilityModal,
    SheetArmorClassModal,
    SheetBackgroundWizardModal,
    SheetClassResourcesModal,
    SheetClassResourcesPanel,
    SheetClassWizardModal,
    SheetCurrencyModal,
    SheetCustomItemModal,
    SheetCustomSpellModal,
    SheetExperienceModal,
    SheetFeatAddModal,
    SheetFeatureAddModal,
    SheetFeatureEditModal,
    SheetHeader,
    SheetHealthModal,
    SheetHealthPanel,
    SheetHealthQuickModal,
    SheetInventoryTabs,
    SheetItemAddModal,
    SheetLongRestModal,
    SheetMagicItemAddModal,
    SheetNameModal,
    SheetProficienciesPanel,
    SheetProficiencyGroupsModal,
    SheetRollModal,
    SheetSavingThrowsPanel,
    SheetSettingsModal,
    SheetShareModal,
    SheetShortRestModal,
    SheetSizeModal,
    SheetSkillsPanel,
    SheetSpeciesWizardModal,
    SheetSpeedModal,
    SheetSpeedTile,
    SheetSpellAddModal,
    SheetSpellcastingModal,
    SheetStatTile,
    SheetVisionModal,
    SheetWeaponProficienciesModal,
  } from './ui';

  // Тело листа переиспользуется в трёх контекстах: отдельная страница, drawer
  // (стандартный режим) и правая панель (широкий режим). «Закрыть» и
  // «развернуть» решает контейнер — тело лишь эмитит события. В drawer крестик
  // даёт стандартная шапка UiDrawer, поэтому свой скрывается через `canClose`.
  const { canExpand = false, canClose = true } = defineProps<{
    canExpand?: boolean;
    canClose?: boolean;
  }>();

  const emit = defineEmits<{
    close: [];
    expand: [];
  }>();

  const {
    character,
    isLocked,
    isReadonly,
    toggleLock,
    ensureEditable,
    abilityRows,
    savingThrowRows,
    skillRows,
    formattedProficiencyBonus,
    formattedInitiative,
    armorClassValue,
    spellcastingBreakdown,
    spellSlotRows,
    totalWeight,
    carryingCapacity,
    setAbilityScore,
    toggleSavingThrowProficiency,
    toggleSpellSlot,
    cycleSkillProficiency,
    adjustClassResource,
    adjustInventoryItemQuantity,
    toggleInventoryItemEquipped,
    copyInventoryItemToSheet,
    copySpellToSheet,
    removeFeature,
    removeInventoryItem,
    removeSpell,
    toggleInspiration,
    downloadCharacter,
  } = useCharacterSheet();

  // Действия над листом целиком (копия и удаление) живут в общем состоянии
  // списка: оттуда же берётся остаток лимита активных листов, а список за
  // мутацией обновляется сам.
  const {
    canCreate,
    isMutating,
    ensureLoaded,
    duplicate,
    copyShared,
    remove: removeSheet,
  } = useCharacterSheetList();

  // Доступ по ссылке: состояние читает меню шапки, меняет — модалка.
  // `viewedShareToken` — токен, по которому открыт чужой лист: им меню
  // сохраняет его к себе.
  const { viewedShareToken, isSheetShared } = useCharacterSheetShare();

  const isShared = computed(() => isSheetShared(character.value.id));

  // Сохранить чужой лист к себе может только тот, у кого есть доступ к самому
  // инструменту: обе ручки закрыты ролью, анониму их показывать нечестно.
  const { isAdmin } = useUserRoles();

  const {
    canSave: canSaveLink,
    ensureLoaded: ensureSavedLoaded,
    isTokenSaved,
    save: saveLink,
  } = useCharacterSheetSaved();

  const canSaveShared = computed(
    () => isReadonly.value && isAdmin.value && Boolean(viewedShareToken.value),
  );

  const isLinkSaved = computed(() =>
    viewedShareToken.value ? isTokenSaved(viewedShareToken.value) : false,
  );

  // Экспорт в PDF: сборщик грузится по клику, поэтому у пункта меню есть
  // собственное состояние загрузки.
  const { isExporting: isPdfExporting, exportToPdf } = useCharacterSheetPdf();

  /** Экспорт открытого листа в PDF. */
  function handleDownloadPdf(): void {
    void exportToPdf(character.value);
  }

  const overlay = useOverlay();

  const toast = useToast();

  // Урон оружия катится напрямую дайс-роллером — без модалки режимов броска.
  const { handleRoll } = useDiceRollHandler();

  // Статус автосохранения пишет автосейв контейнера (страница/панель/drawer),
  // тело листа лишь показывает его в шапке.
  const saveStatus = useCharacterSheetSaveStatus();

  // У листа по ссылке автосейва нет: индикатор скрывается, иначе гость видел бы
  // «Сохранено» о чужом листе, который он не сохранял.
  const headerSaveStatus = computed(() =>
    isReadonly.value ? null : saveStatus.value,
  );

  const isRemoveOpen = ref(false);

  const removeDescription = computed(
    () =>
      `Лист «${character.value.name}» переедет в историю — его можно будет восстановить, пока в лимите есть свободное место.`,
  );

  // Лимиты нужны пунктам меню «Создать копию» и сохранения чужого листа: на
  // отдельной странице списки ещё не загружались, в панели и дровере — уже
  // загружены. Оба списка — приватные ручки: анониму они ответили бы 401 и зря
  // зажгли ошибку в общем состоянии, поэтому у листа по ссылке грузим их только
  // зрителю с доступом к инструменту.
  //
  // Наблюдатель, а не разовый вызов на маунте: страница листа по ссылке —
  // единственная в разделе без гарда, профиль на ней догружается уже после
  // монтирования, и к первому рендеру роль ещё неизвестна.
  watch(
    canSaveShared,
    (saveShared) => {
      if (!saveShared) {
        return;
      }

      void ensureLoaded();
      void ensureSavedLoaded();
    },
    { immediate: true },
  );

  onMounted(() => {
    if (isReadonly.value) {
      return;
    }

    void ensureLoaded();
  });

  // Блок из двух колонок нужен в двух местах: в широком контейнере — как левая
  // часть сетки, в узком (<1024px) — внутри первой вкладки «Основное». Единое
  // определение через reusable-template держит обработчики здесь и не плодит
  // дубли разметки.
  //
  // Адаптив считаем по ширине КОНТЕЙНЕРА, а не вьюпорта: в узком drawer/панели
  // лист должен сворачиваться в один столбец, даже когда окно шире 1024px
  // (иначе внутри drawer остаётся десктопная сетка и всё сжимается).
  // До первого измерения контейнера (ширина 0) ориентируемся на вьюпорт —
  // так полноэкранная страница не мигает компактной раскладкой при загрузке.
  const { isDesktop } = useBreakpoints();
  const rootRef = ref<HTMLElement | null>(null);
  const { width: observedWidth } = useElementSize(rootRef);

  // Первое измерение снимаем сами на маунте: `ResizeObserver` сообщает ширину
  // только после кадра, и лист успевал мигнуть широкой раскладкой — в дровере
  // это особенно заметно, там он вообще никогда не широкий.
  const mountedWidth = ref(0);

  onMounted(() => {
    mountedWidth.value = rootRef.value?.clientWidth ?? 0;
  });

  const rootWidth = computed(() => observedWidth.value || mountedWidth.value);

  const isWide = computed(() =>
    rootWidth.value > 0 ? rootWidth.value >= 1024 : isDesktop.value,
  );

  // Синхронизация высоты правой колонки (характеристики + вкладки) с левой
  // сводкой. Grid-трек `1fr` не ограничивает высоту в auto-высотном контейнере,
  // поэтому длинный список заклинаний раздувал бы блок. Меряем высоту левой
  // колонки и ряда характеристик и явно ограничиваем блок вкладок = левая −
  // характеристики − зазор; список внутри скроллится. Только в широком режиме.
  const leftColumnRef = ref<HTMLElement | null>(null);
  const abilitiesRef = ref<HTMLElement | null>(null);
  const { height: leftColumnHeight } = useElementSize(leftColumnRef);
  const { height: abilitiesHeight } = useElementSize(abilitiesRef);

  const RIGHT_COLUMN_GAP = 16;

  const tabsStyle = computed(() => {
    if (!isWide.value || leftColumnHeight.value <= 0) {
      return undefined;
    }

    const maxHeight = Math.max(
      0,
      Math.round(
        leftColumnHeight.value - abilitiesHeight.value - RIGHT_COLUMN_GAP,
      ),
    );

    return { maxHeight: `${maxHeight}px` };
  });

  const [DefineSummary, ReuseSummary] = createReusableTemplate();

  // Без destroyOnClose: закрытый оверлей удаляется из реестра useOverlay,
  // и повторный open() бросает «Overlay not found». Компонент модалки и так
  // размонтируется после закрытия, поэтому черновики сбрасываются.
  const abilityModal = overlay.create(SheetAbilityModal, {
    props: {
      abilityKey: 'strength',
    },
  });

  const speedModal = overlay.create(SheetSpeedModal);

  const healthModal = overlay.create(SheetHealthModal);

  const healthQuickModal = overlay.create(SheetHealthQuickModal);

  const shortRestModal = overlay.create(SheetShortRestModal);

  const longRestModal = overlay.create(SheetLongRestModal);

  const nameModal = overlay.create(SheetNameModal);

  const visionModal = overlay.create(SheetVisionModal);

  const rollModal = overlay.create(SheetRollModal, {
    props: {
      title: '',
      modifier: 0,
    },
  });

  const experienceModal = overlay.create(SheetExperienceModal);

  const armorClassModal = overlay.create(SheetArmorClassModal);

  const classResourcesModal = overlay.create(SheetClassResourcesModal);

  const currencyModal = overlay.create(SheetCurrencyModal);

  const proficiencyGroupsModal = overlay.create(SheetProficiencyGroupsModal, {
    props: {
      title: '',
      target: 'armor',
      groups: [],
    },
  });

  const weaponProficienciesModal = overlay.create(
    SheetWeaponProficienciesModal,
  );

  const speciesWizardModal = overlay.create(SheetSpeciesWizardModal);

  const classWizardModal = overlay.create(SheetClassWizardModal);

  const backgroundWizardModal = overlay.create(SheetBackgroundWizardModal);

  const sizeModal = overlay.create(SheetSizeModal);

  const settingsModal = overlay.create(SheetSettingsModal, {
    props: {
      character: character.value,
    },
  });

  const shareModal = overlay.create(SheetShareModal, {
    props: {
      sheetId: '',
    },
  });

  const featureAddModal = overlay.create(SheetFeatureAddModal);

  const featureEditModal = overlay.create(SheetFeatureEditModal, {
    props: {
      featureId: '',
    },
  });

  const featAddModal = overlay.create(SheetFeatAddModal);

  const spellAddModal = overlay.create(SheetSpellAddModal);

  // Одна модалка на добавление и редактирование своего заклинания: URL пустой —
  // форма создаёт новое.
  const customSpellModal = overlay.create(SheetCustomSpellModal, {
    props: {
      spellUrl: null,
    },
  });

  const spellcastingModal = overlay.create(SheetSpellcastingModal);

  const itemAddModal = overlay.create(SheetItemAddModal);

  const magicItemAddModal = overlay.create(SheetMagicItemAddModal);

  // Одна модалка на добавление и редактирование своего предмета: идентификатор
  // пустой — форма создаёт новый.
  const customItemModal = overlay.create(SheetCustomItemModal, {
    props: {
      inventoryItemId: null,
    },
  });

  function handleAbilityEdit(abilityKey: AbilityKey) {
    if (!ensureEditable()) {
      return;
    }

    abilityModal.open({ abilityKey });
  }

  function handleAbilityRoll(abilityKey: AbilityKey) {
    rollModal.open({
      title: `Проверка: ${ABILITY_LABELS[abilityKey]}`,
      modifier: getModifier(character.value.abilities[abilityKey]),
    });
  }

  function handleAbilityAdjust(abilityKey: AbilityKey, delta: number) {
    if (!ensureEditable()) {
      return;
    }

    setAbilityScore(abilityKey, character.value.abilities[abilityKey] + delta);
  }

  function handleSpeedEdit() {
    if (!ensureEditable()) {
      return;
    }

    speedModal.open();
  }

  function handleHealthEdit() {
    // Чужой лист хиты не меняет ни быстрой модалкой, ни полной — обе пишут
    // в документ, а сохранять зрителю некуда.
    if (isReadonly.value) {
      return;
    }

    // В заблокированном (игровом) режиме клик по хитам открывает быструю
    // модалку урона/лечения; в режиме редактирования — полную настройку.
    if (isLocked.value) {
      healthQuickModal.open();

      return;
    }

    healthModal.open();
  }

  /**
   * Короткий отдых — игровое действие: запертый лист его разрешает, чужой
   * (открытый по ссылке) нет, потому что траты костей зрителю некуда сохранить.
   */
  function handleShortRest() {
    if (isReadonly.value) {
      return;
    }

    shortRestModal.open();
  }

  /** Продолжительный отдых — такое же игровое действие, как короткий. */
  function handleLongRest() {
    if (isReadonly.value) {
      return;
    }

    longRestModal.open();
  }

  function handleNameEdit() {
    if (!ensureEditable()) {
      return;
    }

    nameModal.open();
  }

  function handleProgressEdit() {
    if (!ensureEditable()) {
      return;
    }

    experienceModal.open();
  }

  function handleArmorClassEdit() {
    if (!ensureEditable()) {
      return;
    }

    armorClassModal.open();
  }

  function handleClassResourcesEdit() {
    if (!ensureEditable()) {
      return;
    }

    classResourcesModal.open();
  }

  function handleCurrencyEdit() {
    if (!ensureEditable()) {
      return;
    }

    currencyModal.open();
  }

  function handleProficienciesEdit(group: ProficiencyGroupKey) {
    if (!ensureEditable()) {
      return;
    }

    if (group === 'armor') {
      proficiencyGroupsModal.open({
        title: 'Владение бронёй',
        target: 'armor',
        groups: ARMOR_PROFICIENCY_GROUPS,
      });
    }

    if (group === 'weapons') {
      weaponProficienciesModal.open();
    }

    if (group === 'tools') {
      proficiencyGroupsModal.open({
        title: 'Владение инструментами',
        target: 'tools',
        groups: TOOL_PROFICIENCY_GROUPS,
      });
    }

    if (group === 'languages') {
      proficiencyGroupsModal.open({
        title: 'Владение языками',
        target: 'languages',
        groups: LANGUAGE_PROFICIENCY_GROUPS,
      });
    }
  }

  function handleInitiativeRoll() {
    rollModal.open({
      title: 'Инициатива',
      modifier: getModifier(character.value.abilities.dexterity),
      actionLabel: 'Бросить инициативу',
    });
  }

  function handleSavingThrowRoll(row: SavingThrowRow) {
    rollModal.open({
      title: `Спасбросок: ${ABILITY_LABELS[row.key]}`,
      modifier: row.value,
      actionLabel: 'Бросить спасбросок',
    });
  }

  function handleSkillRoll(row: SkillRow) {
    rollModal.open({
      title: `Проверка: ${row.name}`,
      modifier: row.value,
    });
  }

  function handleItemAttackRoll(inventoryItem: CharacterInventoryItem) {
    if (!inventoryItem.weapon) {
      return;
    }

    rollModal.open({
      title: `Атака: ${inventoryItem.name}`,
      modifier: getWeaponAttackBonus(character.value, inventoryItem.weapon)
        .value,
      actionLabel: 'Бросить атаку',
    });
  }

  // Урон катится сразу: режимов преимущества у него нет, а доп. бонус к урону
  // всегда можно докинуть в самом дайс-роллере.
  function handleItemDamageRoll(inventoryItem: CharacterInventoryItem) {
    const damage = inventoryItem.weapon
      ? getWeaponDamage(character.value, inventoryItem.weapon)
      : null;

    if (!damage) {
      return;
    }

    handleRoll(damage.formula);
  }

  function handleVisionEdit() {
    if (!ensureEditable()) {
      return;
    }

    visionModal.open();
  }

  function handleSpeciesEdit() {
    if (!ensureEditable()) {
      return;
    }

    speciesWizardModal.open();
  }

  function handleClassEdit() {
    if (!ensureEditable()) {
      return;
    }

    classWizardModal.open();
  }

  function handleBackgroundEdit() {
    if (!ensureEditable()) {
      return;
    }

    backgroundWizardModal.open();
  }

  function handleSizeEdit() {
    if (!ensureEditable()) {
      return;
    }

    sizeModal.open();
  }

  function handleFeatureAdd() {
    if (!ensureEditable()) {
      return;
    }

    featureAddModal.open();
  }

  function handleFeatAdd() {
    if (!ensureEditable()) {
      return;
    }

    featAddModal.open();
  }

  function handleFeatureEdit(featureId: string) {
    if (!ensureEditable()) {
      return;
    }

    featureEditModal.open({ featureId });
  }

  function handleSpellAdd() {
    if (!ensureEditable()) {
      return;
    }

    spellAddModal.open();
  }

  function handleCustomSpellAdd() {
    if (!ensureEditable()) {
      return;
    }

    customSpellModal.open({ spellUrl: null });
  }

  function handleSpellEdit(spellUrl: string) {
    if (!ensureEditable()) {
      return;
    }

    customSpellModal.open({ spellUrl });
  }

  /**
   * Копия каталожного заклинания в лист: экшен дозагружает описание из
   * справочника, поэтому асинхронный — ошибку запроса он гасит сам.
   */
  function handleSpellCopy(spellUrl: string) {
    void copySpellToSheet(spellUrl);
  }

  function handleSpellcastingEdit() {
    if (!ensureEditable()) {
      return;
    }

    spellcastingModal.open();
  }

  function handleSettingsEdit() {
    if (!ensureEditable()) {
      return;
    }

    settingsModal.open({ character: character.value });
  }

  function handleItemAdd() {
    if (!ensureEditable()) {
      return;
    }

    itemAddModal.open();
  }

  function handleMagicItemAdd() {
    if (!ensureEditable()) {
      return;
    }

    magicItemAddModal.open();
  }

  function handleCustomItemAdd() {
    if (!ensureEditable()) {
      return;
    }

    customItemModal.open({ inventoryItemId: null });
  }

  function handleItemEdit(inventoryItemId: string) {
    if (!ensureEditable()) {
      return;
    }

    customItemModal.open({ inventoryItemId });
  }

  /** Копия каталожного предмета в лист — как и у заклинания, с дозагрузкой. */
  function handleItemCopy(inventoryItemId: string) {
    void copyInventoryItemToSheet(inventoryItemId);
  }

  /**
   * Копия открытого листа: копируется текущее состояние вместе с правками,
   * которые ещё не успел отправить автосейв. Тост об успехе показывает список.
   */
  async function handleDuplicate() {
    await duplicate(character.value);
  }

  /** Запрос на удаление листа — подтверждение показывает диалог. */
  function handleRemove() {
    isRemoveOpen.value = true;
  }

  /** Управление доступом по ссылке — только у владельца открытого листа. */
  function handleShare() {
    shareModal.open({ sheetId: character.value.id });
  }

  /** Копия чужого листа себе: дальше это обычный свой лист. */
  async function handleCopyShared() {
    await copyShared(character.value);
  }

  /** Сохранение ссылки на чужой лист в раздел «Другие листы». */
  async function handleSaveLink() {
    if (!viewedShareToken.value) {
      return;
    }

    await saveLink(viewedShareToken.value);
  }

  /** Подтверждённое удаление: лист уходит в историю, затем закрывается. */
  async function handleRemoveConfirm() {
    if (!(await removeSheet(character.value.id))) {
      return;
    }

    isRemoveOpen.value = false;

    toast.add({
      title: 'Лист персонажа удалён',
      description: 'Его можно восстановить из истории листов.',
      color: 'success',
      icon: 'tabler:trash',
    });

    emit('close');
  }

  /** Закрытие листа — конкретное действие определяет контейнер. */
  function handleClose() {
    emit('close');
  }

  /** Запрос открыть лист на отдельной странице (из drawer или панели). */
  function handleExpand() {
    emit('expand');
  }
</script>

<template>
  <div
    ref="rootRef"
    class="@container mx-auto flex w-full max-w-350 flex-col gap-4"
  >
    <SheetHeader
      :character="character"
      :locked="isLocked"
      :can-expand="canExpand"
      :can-close="canClose"
      :can-duplicate="canCreate"
      :readonly="isReadonly"
      :shared="isShared"
      :save-status="headerSaveStatus"
      :pdf-loading="isPdfExporting"
      :can-save-shared="canSaveShared"
      :can-copy-shared="canCreate && !isMutating"
      :can-save-link="canSaveLink"
      :link-saved="isLinkSaved"
      @close="handleClose"
      @download="downloadCharacter"
      @download-pdf="handleDownloadPdf"
      @duplicate="handleDuplicate"
      @remove="handleRemove"
      @share="handleShare"
      @copy-shared="handleCopyShared"
      @save-link="handleSaveLink"
      @expand="handleExpand"
      @edit-background="handleBackgroundEdit"
      @edit-class="handleClassEdit"
      @edit-name="handleNameEdit"
      @edit-progress="handleProgressEdit"
      @edit-settings="handleSettingsEdit"
      @edit-size="handleSizeEdit"
      @edit-species="handleSpeciesEdit"
      @edit-vision="handleVisionEdit"
      @long-rest="handleLongRest"
      @short-rest="handleShortRest"
      @toggle-inspiration="toggleInspiration"
      @toggle-lock="toggleLock"
    />

    <div class="relative flex items-center justify-center py-1">
      <div
        class="h-px w-full bg-linear-to-r from-transparent via-warning/40 to-transparent"
      />

      <div class="absolute size-2 rotate-45 border border-warning bg-default" />
    </div>

    <DefineSummary>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div class="flex flex-col gap-4">
          <div class="grid grid-cols-2 gap-4">
            <SheetStatTile
              label="Мастерство"
              :value="formattedProficiencyBonus"
            />

            <SheetStatTile
              label="Класс доспеха"
              short-label="КД"
              :value="armorClassValue"
              interactive
              press-label="Настроить класс доспеха"
              @press="handleArmorClassEdit"
            />
          </div>

          <SheetHealthPanel
            :health="character.health"
            :hit-dice="character.hitDice"
            :extra-hit-dice="character.extraHitDice"
            @edit="handleHealthEdit"
          />

          <SheetSavingThrowsPanel
            :rows="savingThrowRows"
            @roll="handleSavingThrowRoll"
            @toggle="toggleSavingThrowProficiency"
          />

          <SheetProficienciesPanel
            :proficiencies="character.proficiencies"
            @edit="handleProficienciesEdit"
          />
        </div>

        <div class="flex flex-col gap-4">
          <div class="grid grid-cols-2 gap-4">
            <SheetSpeedTile
              :speed="character.speed"
              @edit="handleSpeedEdit"
            />

            <SheetStatTile
              label="Инициатива"
              :value="formattedInitiative"
              interactive
              @press="handleInitiativeRoll"
            />
          </div>

          <SheetClassResourcesPanel
            :resources="character.classResources"
            @adjust="adjustClassResource"
            @edit="handleClassResourcesEdit"
          />

          <SheetSkillsPanel
            :rows="skillRows"
            class="grow"
            @cycle="cycleSkillProficiency"
            @roll="handleSkillRoll"
          />
        </div>
      </div>
    </DefineSummary>

    <div
      class="grid grid-cols-1 gap-4 @5xl:grid-cols-12 @5xl:grid-rows-[min-content_1fr]"
    >
      <div
        ref="abilitiesRef"
        class="@5xl:col-span-6 @5xl:col-start-7 @5xl:row-start-1"
      >
        <SheetAbilitiesRow
          :rows="abilityRows"
          @roll="handleAbilityRoll"
          @settings="handleAbilityEdit"
          @adjust="handleAbilityAdjust"
        />
      </div>

      <div
        v-if="isWide"
        ref="leftColumnRef"
        class="@5xl:col-span-6 @5xl:col-start-1 @5xl:row-span-2 @5xl:row-start-1 @5xl:self-start"
      >
        <ReuseSummary />
      </div>

      <SheetInventoryTabs
        :currency="character.currency"
        :custom-currencies="character.customCurrencies"
        :inventory="character.inventory"
        :total-weight="totalWeight"
        :carrying-capacity="carryingCapacity"
        :features="character.features"
        :spells="character.spells"
        :spellcasting="spellcastingBreakdown"
        :spell-slots="spellSlotRows"
        :has-main-tab="!isWide"
        :style="tabsStyle"
        class="@5xl:col-span-6 @5xl:col-start-7 @5xl:row-start-2 @5xl:min-h-0"
        @add-feature="handleFeatureAdd"
        @add-feat="handleFeatAdd"
        @add-item="handleItemAdd"
        @add-magic-item="handleMagicItemAdd"
        @add-custom-item="handleCustomItemAdd"
        @edit-item="handleItemEdit"
        @copy-item="handleItemCopy"
        @add-spell="handleSpellAdd"
        @add-custom-spell="handleCustomSpellAdd"
        @edit-spell="handleSpellEdit"
        @copy-spell="handleSpellCopy"
        @edit-spellcasting="handleSpellcastingEdit"
        @edit-currency="handleCurrencyEdit"
        @adjust-item-quantity="adjustInventoryItemQuantity"
        @toggle-item-equip="toggleInventoryItemEquipped"
        @roll-item-attack="handleItemAttackRoll"
        @roll-item-damage="handleItemDamageRoll"
        @edit-feature="handleFeatureEdit"
        @remove-feature="removeFeature"
        @remove-item="removeInventoryItem"
        @remove-spell="removeSpell"
        @toggle-spell-slot="toggleSpellSlot"
      >
        <template #main>
          <ReuseSummary />
        </template>
      </SheetInventoryTabs>
    </div>

    <ConfirmDialog
      v-model:open="isRemoveOpen"
      title="Удалить лист персонажа?"
      :description="removeDescription"
      confirm-label="Удалить"
      confirm-color="error"
      confirm-icon="tabler:trash"
      :loading="isMutating"
      @confirm="handleRemoveConfirm"
    />
  </div>
</template>
