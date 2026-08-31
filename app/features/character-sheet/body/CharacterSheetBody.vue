<script setup lang="ts">
  import type {
    AbilityKey,
    CharacterInventoryItem,
    PersonalityFieldKey,
    PreparedSpellKind,
    ProficiencyGroupKey,
    SavingThrowRow,
    SkillRow,
    SpellDamageRoll,
  } from '../model';

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
    combineRollModes,
    EMPTY_DAMAGE_ROLL_SOURCE,
    findCharacterSpell,
    getAbilityCheckValue,
    getAvailableInnateSpells,
    getSkillKeyByName,
    getWeaponAttackBonus,
    getWeaponAttackRollMode,
    getWeaponDamageSource,
    isProficientWeapon,
    LANGUAGE_PROFICIENCY_GROUPS,
  } from '../model';
  import CharacterSheetSkeleton from './CharacterSheetSkeleton.vue';
  import {
    SheetAbilitiesRow,
    SheetAbilityModal,
    SheetAbilityScoresModal,
    SheetArmorClassModal,
    SheetAttunementModal,
    SheetBackgroundWizardModal,
    SheetCarryingCapacityModal,
    SheetClassesModal,
    SheetClassResourcesModal,
    SheetClassResourcesPanel,
    SheetCurrencyModal,
    SheetCustomItemModal,
    SheetCustomSpellModal,
    SheetDamageModal,
    SheetDefencesPanel,
    SheetEffectModal,
    SheetExhaustionPanel,
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
    SheetNoteModal,
    SheetPersonalityDescriptionModal,
    SheetPersonalityModal,
    SheetPreparedSpellsModal,
    SheetProficienciesPanel,
    SheetProficiencyGroupsModal,
    SheetRollModal,
    SheetSavingThrowsPanel,
    SheetSavingThrowsSettingsModal,
    SheetSettingsModal,
    SheetShareModal,
    SheetShortRestModal,
    SheetSizeModal,
    SheetSkillsPanel,
    SheetSkillsSettingsModal,
    SheetSpeciesWizardModal,
    SheetSpeedModal,
    SheetSpeedTile,
    SheetSpellAbilityModal,
    SheetSpellAddModal,
    SheetSpellcastingModal,
    SheetStatTile,
    SheetToolProficienciesModal,
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
    skillGroups,
    effectiveSpeed,
    featDefences,
    hasFeatDefences,
    formattedProficiencyBonus,
    maxHitPoints,
    maxHitPointsHint,
    initiativeBonus,
    formattedInitiative,
    armorClassValue,
    spellcastingBreakdown,
    spellSlotRows,
    totalWeight,
    carryingCapacity,
    attunement,
    setAbilityScore,
    setSpellSpellcastingAbility,
    spendSpellSlot,
    toggleSavingThrowProficiency,
    toggleInnateSpellPrepared,
    toggleSpellPrepared,
    toggleSpellSlot,
    cycleSkillProficiency,
    setExhaustion,
    adjustClassResource,
    adjustInventoryItemQuantity,
    toggleInventoryItemEquipped,
    toggleInventoryItemAttuned,
    toggleInventoryItemActive,
    adjustInventoryItemCharges,
    restoreInventoryItemCharges,
    toggleInventoryItemTwoHanded,
    copyInnateSpellToSheet,
    copyInventoryItemToSheet,
    copySpellToSheet,
    removeFeature,
    removeInnateSpell,
    removeInventoryItem,
    removeNote,
    removeSpell,
    toggleInspiration,
    downloadCharacter,
    getRollMode,
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
  // инструменту: обе ручки закрыты авторизацией, анониму их показывать нечестно.
  const { isLoggedIn } = useUser();

  const {
    canSave: canSaveLink,
    ensureLoaded: ensureSavedLoaded,
    isTokenSaved,
    save: saveLink,
  } = useCharacterSheetSaved();

  const canSaveShared = computed(
    () =>
      isReadonly.value && isLoggedIn.value && Boolean(viewedShareToken.value),
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
  //
  // До первого замера содержимое не рендерим вовсе — вместо него скелетон.
  // Угадывать раскладку по вьюпорту нельзя: в дровере и панели догадка почти
  // всегда неверна, лист монтировался широким и тут же перестраивался — было
  // видно, как вкладка «Основное» «подгружается» после открытия. Все
  // контейнеры листа клиентские (`ClientOnly`, drawer), поэтому замер в
  // `onMounted` успевает до первой отрисовки кадра и скелетон в обычном
  // случае даже не показывается.
  const rootRef = ref<HTMLElement | null>(null);
  const { width: observedWidth } = useElementSize(rootRef);

  // Первое измерение снимаем сами на маунте: `ResizeObserver` сообщает ширину
  // только после кадра — лист лишний кадр стоял бы скелетоном.
  const mountedWidth = ref(0);

  onMounted(() => {
    mountedWidth.value = rootRef.value?.clientWidth ?? 0;
  });

  const rootWidth = computed(() => observedWidth.value || mountedWidth.value);

  /** Контейнер измерен — лист можно рендерить сразу в верной раскладке. */
  const isMeasured = computed(() => rootWidth.value > 0);

  const isWide = computed(() => rootWidth.value >= 1024);

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

  // Набор характеристик целиком (как в калькуляторе) — в отличие от модалки
  // одной характеристики, ему нечего передавать: всё нужное он берёт из листа.
  const abilityScoresModal = overlay.create(SheetAbilityScoresModal);

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
      ability: 'strength',
    },
  });

  const damageModal = overlay.create(SheetDamageModal, {
    props: {
      title: '',
      damage: EMPTY_DAMAGE_ROLL_SOURCE,
    },
  });

  const experienceModal = overlay.create(SheetExperienceModal);

  const armorClassModal = overlay.create(SheetArmorClassModal);

  const classResourcesModal = overlay.create(SheetClassResourcesModal);

  const skillsSettingsModal = overlay.create(SheetSkillsSettingsModal);

  const savingThrowsSettingsModal = overlay.create(
    SheetSavingThrowsSettingsModal,
  );

  const currencyModal = overlay.create(SheetCurrencyModal);

  const carryingCapacityModal = overlay.create(SheetCarryingCapacityModal);

  const attunementModal = overlay.create(SheetAttunementModal);

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

  const toolProficienciesModal = overlay.create(SheetToolProficienciesModal);

  const speciesWizardModal = overlay.create(SheetSpeciesWizardModal);

  // Клик по классу в шапке открывает СПИСОК классов персонажа: оттуда класс
  // меняют, добавляют второй (мультикласс) и удаляют ненужный.
  const classesModal = overlay.create(SheetClassesModal);

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

  // Одна модалка на добавление и правку заметки: идентификатор пустой — форма
  // создаёт новую запись.
  const noteModal = overlay.create(SheetNoteModal, {
    props: {
      noteId: null,
    },
  });

  // Одна модалка на добавление и правку своего эффекта — тем же приёмом, что и
  // заметка: пустой идентификатор означает новую запись.
  const effectModal = overlay.create(SheetEffectModal, {
    props: {
      effectId: null,
    },
  });

  // Одна модалка на все приметы: поле, с которого начали правку, получает
  // курсор — null означает вход карандашом, без выделенного поля.
  const personalityModal = overlay.create(SheetPersonalityModal, {
    props: {
      field: null,
    },
  });

  const personalityDescriptionModal = overlay.create(
    SheetPersonalityDescriptionModal,
  );

  const spellAddModal = overlay.create(SheetSpellAddModal);

  // Одна модалка на добавление и редактирование своего заклинания: URL пустой —
  // форма создаёт новое.
  const customSpellModal = overlay.create(SheetCustomSpellModal, {
    props: {
      spellUrl: null,
    },
  });

  const spellcastingModal = overlay.create(SheetSpellcastingModal, {
    props: { classUrl: '' },
  });

  // Заклинание приходит нажатием пункта меню строки: значения при создании —
  // лишь отправная точка, `open()` подставляет нужные.
  const spellAbilityModal = overlay.create(SheetSpellAbilityModal, {
    props: { spellName: '', ability: null, classAbility: null },
  });

  // Вид подготовки приходит нажатием на плитку: значение при создании — лишь
  // отправная точка, `open()` подставляет нужное.
  const preparedSpellsModal = overlay.create(SheetPreparedSpellsModal, {
    props: { kind: 'spells' },
  });

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

  function handleAbilityScoresEdit() {
    if (!ensureEditable()) {
      return;
    }

    abilityScoresModal.open();
  }

  function handleAbilityRoll(abilityKey: AbilityKey) {
    rollModal.open({
      title: `Проверка: ${ABILITY_LABELS[abilityKey]}`,
      modifier: getAbilityCheckValue(character.value, abilityKey),
      ability: abilityKey,
    });
  }

  // Характеристика под курсором: пока плитка наведена, её навыки подсвечены в
  // списке — так видно, на что влияет значение, ещё до открытия настроек.
  const highlightedAbility = ref<AbilityKey | null>(null);

  function handleAbilityHighlight(abilityKey: AbilityKey | null) {
    highlightedAbility.value = abilityKey;
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

  function handleSkillsSettings() {
    if (!ensureEditable()) {
      return;
    }

    skillsSettingsModal.open();
  }

  function handleSavingThrowsSettings() {
    if (!ensureEditable()) {
      return;
    }

    savingThrowsSettingsModal.open();
  }

  function handleCurrencyEdit() {
    if (!ensureEditable()) {
      return;
    }

    currencyModal.open();
  }

  function handleCarryingCapacityEdit() {
    if (!ensureEditable()) {
      return;
    }

    carryingCapacityModal.open();
  }

  function handleAttunementEdit() {
    if (!ensureEditable()) {
      return;
    }

    attunementModal.open();
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
      toolProficienciesModal.open();
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
      modifier: initiativeBonus.value,
      ability: 'dexterity',
      actionLabel: 'Бросить инициативу',
      mode: getRollMode({ kind: 'initiative' }),
    });
  }

  function handleSavingThrowRoll(row: SavingThrowRow) {
    rollModal.open({
      title: `Спасбросок: ${ABILITY_LABELS[row.key]}`,
      modifier: row.value,
      // Характеристика строки, а не самого спасброска: от неё модалка считает
      // подмену, а в подменённом спасброске это уже другая характеристика.
      ability: row.ability,
      actionLabel: 'Бросить спасбросок',
      mode: getRollMode({ kind: 'savingThrow', ability: row.key }),
      // Источник спасброска лист не знает — его называет игрок в модалке:
      // выдать преимущество против яда по предмету «против заклинаний» хуже,
      // чем спросить.
      resolveMode: (source) =>
        getRollMode({
          kind: 'savingThrow',
          ability: row.key,
          againstMagic: source.againstMagic,
          againstCondition: source.condition ?? undefined,
        }),
    });
  }

  function handleSkillRoll(row: SkillRow) {
    rollModal.open({
      title: `Проверка: ${row.name}`,
      modifier: row.value,
      ability: row.ability,
      mode: getRollMode({
        kind: 'skill',
        ability: row.ability,
        // Свой навык игрока в словаре эффектов не значится — флагов у него нет.
        skill: getSkillKeyByName(row.name),
      }),
    });
  }

  /** Трата одного заряда предмета нажатием на плитку зарядов. */
  function handleItemChargeSpend(inventoryItemId: string) {
    adjustInventoryItemCharges(inventoryItemId, -1);
  }

  function handleItemAttackRoll(inventoryItem: CharacterInventoryItem) {
    if (!inventoryItem.weapon) {
      return;
    }

    const attack = getWeaponAttackBonus(
      character.value,
      inventoryItem.weapon,
      isProficientWeapon(character.value, inventoryItem),
    );

    rollModal.open({
      title: `Атака: ${inventoryItem.name}`,
      modifier: attack.value,
      ability: attack.ability,
      actionLabel: 'Бросить атаку',
      // Режим дают два независимых источника: помеха тяжёлого оружия не по руке
      // (правила 2024) и активные эффекты — Опутанный бьёт с помехой. Свести их
      // можно только правилом 5e, поэтому не «или», а `combineRollModes`.
      mode: combineRollModes(
        getWeaponAttackRollMode(attack),
        getRollMode({
          kind: 'attack',
          attackType: inventoryItem.weapon.ranged ? 'ranged' : 'melee',
        }),
      ),
    });
  }

  function handleItemDamageRoll(inventoryItem: CharacterInventoryItem) {
    const damage = inventoryItem.weapon
      ? getWeaponDamageSource(
          character.value,
          inventoryItem.weapon,
          inventoryItem.twoHanded,
        )
      : null;

    if (!damage) {
      return;
    }

    damageModal.open({ title: `Урон: ${inventoryItem.name}`, damage });
  }

  /**
   * Бросок урона заклинанием: кроме кубов тратится ячейка его круга — бросок и
   * есть накладывание. Ячейка уходит только после подтверждённого броска: окно
   * настройки можно и закрыть, ничего не бросив. Заговорам и кругам, которых
   * класс не даёт, тратить нечего.
   */
  async function handleSpellDamageRoll(roll: SpellDamageRoll) {
    const isRolled = await damageModal.open({
      title: roll.title,
      damage: roll.damage,
    }).result;

    if (!isRolled) {
      return;
    }

    spendSpellSlot(roll.level);
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

  const availableInnateSpells = computed(() =>
    getAvailableInnateSpells(character.value),
  );

  function handleClassEdit() {
    if (!ensureEditable()) {
      return;
    }

    classesModal.open();
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

  function handleEffectAdd() {
    if (!ensureEditable()) {
      return;
    }

    effectModal.open({ effectId: null });
  }

  function handleEffectEdit(effectId: string) {
    if (!ensureEditable()) {
      return;
    }

    effectModal.open({ effectId });
  }

  function handleNoteAdd() {
    if (!ensureEditable()) {
      return;
    }

    noteModal.open({ noteId: null });
  }

  function handleNoteEdit(noteId: string) {
    if (!ensureEditable()) {
      return;
    }

    noteModal.open({ noteId });
  }

  function handlePersonalityEdit(field: PersonalityFieldKey | null) {
    if (!ensureEditable()) {
      return;
    }

    personalityModal.open({ field });
  }

  function handlePersonalityDescriptionEdit() {
    if (!ensureEditable()) {
      return;
    }

    personalityDescriptionModal.open();
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

  function handleInnateSpellCopy(spellUrl: string) {
    void copyInnateSpellToSheet(spellUrl);
  }

  /**
   * Настройка характеристики одного заклинания: от неё считаются его Сл
   * спасброска и бонус атаки. «От класса» возвращает запись к общему подсчёту.
   *
   * @param spellUrl URL заклинания.
   */
  async function handleSpellAbilityEdit(spellUrl: string) {
    if (!ensureEditable()) {
      return;
    }

    const spell = findCharacterSpell(character.value, spellUrl);

    if (!spell) {
      return;
    }

    const ability = await spellAbilityModal.open({
      spellName: spell.name,
      ability: spell.spellcastingAbility ?? null,
      // Что подставит «Авто»: характеристика первого класса-заклинателя — по
      // ней лист считает заклинания книги.
      classAbility: spellcastingBreakdown.value.ability,
    }).result;

    if (ability === undefined) {
      return;
    }

    setSpellSpellcastingAbility(spellUrl, ability);
  }

  function handleSpellcastingEdit(classUrl: string) {
    if (!ensureEditable()) {
      return;
    }

    spellcastingModal.open({ classUrl });
  }

  function handlePreparedSpellsEdit(kind: PreparedSpellKind) {
    if (!ensureEditable()) {
      return;
    }

    preparedSpellsModal.open({ kind });
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
    <!-- До замера ширины контейнера — скелетон: он свёрстан на
      container-запросах и совпадает с листом в любой раскладке, а подмена
      происходит до первой отрисовки, поэтому глазу видна только когда контейнер
      действительно ещё не готов -->
    <CharacterSheetSkeleton v-if="!isMeasured" />

    <template v-else>
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
        @edit-ability-scores="handleAbilityScoresEdit"
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
          class="h-px w-full bg-linear-to-r from-transparent via-primary/40 to-transparent"
        />

        <div
          class="absolute size-2 rotate-45 border border-primary bg-default"
        />
      </div>

      <DefineSummary>
        <!--
          На мобильном (< sm) колонки-обёртки и пары плиток схлопываются в
          display:contents: все блоки становятся прямыми элементами сетки.
          Четыре плитки показателей без order-* всплывают наверх (2×2, а с @md —
          одной строкой), остальные блоки растягиваются на всю ширину и идут в
          порядке order-*: здоровье → истощение → ресурсы класса → навыки →
          спасброски → владения. На sm колонки восстанавливаются —
          двухколоночная раскладка прежняя.
        -->
        <div class="grid grid-cols-2 gap-4 max-sm:@md:grid-cols-4">
          <div class="flex flex-col gap-4 max-sm:contents">
            <div class="grid grid-cols-2 gap-4 max-sm:contents">
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
              :max-hit-points="maxHitPoints"
              :max-hit-points-hint="maxHitPointsHint"
              :hit-dice="character.hitDice"
              :extra-hit-dice="character.extraHitDice"
              class="max-sm:order-1 max-sm:col-span-full"
              @edit="handleHealthEdit"
            />

            <SheetExhaustionPanel
              :level="character.health.exhaustion"
              :speed-unit="character.speed.unit"
              class="max-sm:order-2 max-sm:col-span-full"
              @select="setExhaustion"
            />

            <SheetSavingThrowsPanel
              :rows="savingThrowRows"
              class="max-sm:order-5 max-sm:col-span-full"
              @roll="handleSavingThrowRoll"
              @settings="handleSavingThrowsSettings"
              @toggle="toggleSavingThrowProficiency"
            />

            <SheetProficienciesPanel
              :proficiencies="character.proficiencies"
              class="max-sm:order-6 max-sm:col-span-full"
              @edit="handleProficienciesEdit"
            />

            <!-- Сопротивления, иммунитеты и прочее от черт: панель появляется,
              только если черта их выдала — своего понятия для них лист не
              хранит и правке они не подлежат -->
            <SheetDefencesPanel
              v-if="hasFeatDefences"
              :defences="featDefences"
              :unit="character.speed.unit"
              class="max-sm:order-7 max-sm:col-span-full"
            />
          </div>

          <div class="flex flex-col gap-4 max-sm:contents">
            <div class="grid grid-cols-2 gap-4 max-sm:contents">
              <SheetSpeedTile
                :speed="effectiveSpeed"
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
              class="max-sm:order-3 max-sm:col-span-full"
              @adjust="adjustClassResource"
              @edit="handleClassResourcesEdit"
            />

            <SheetSkillsPanel
              :groups="skillGroups"
              :highlighted-ability="highlightedAbility"
              class="grow max-sm:order-4 max-sm:col-span-full"
              @cycle="cycleSkillProficiency"
              @roll="handleSkillRoll"
              @settings="handleSkillsSettings"
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
            @highlight="handleAbilityHighlight"
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
          :attunement="attunement"
          :features="character.features"
          :spells="character.spells"
          :innate-spells="availableInnateSpells"
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
          @edit-spell-ability="handleSpellAbilityEdit"
          @edit-prepared-spells="handlePreparedSpellsEdit"
          @edit-currency="handleCurrencyEdit"
          @edit-carrying-capacity="handleCarryingCapacityEdit"
          @edit-attunement="handleAttunementEdit"
          @adjust-item-quantity="adjustInventoryItemQuantity"
          @toggle-item-equip="toggleInventoryItemEquipped"
          @toggle-item-attuned="toggleInventoryItemAttuned"
          @toggle-item-active="toggleInventoryItemActive"
          @spend-item-charge="handleItemChargeSpend"
          @restore-item-charges="restoreInventoryItemCharges"
          @toggle-item-two-handed="toggleInventoryItemTwoHanded"
          @roll-item-attack="handleItemAttackRoll"
          @roll-item-damage="handleItemDamageRoll"
          @edit-feature="handleFeatureEdit"
          @add-effect="handleEffectAdd"
          @edit-effect="handleEffectEdit"
          @add-note="handleNoteAdd"
          @edit-note="handleNoteEdit"
          @remove-note="removeNote"
          @edit-personality="handlePersonalityEdit"
          @edit-personality-description="handlePersonalityDescriptionEdit"
          @edit-background="handleBackgroundEdit"
          @remove-feature="removeFeature"
          @remove-item="removeInventoryItem"
          @remove-spell="removeSpell"
          @copy-innate-spell="handleInnateSpellCopy"
          @remove-innate-spell="removeInnateSpell"
          @roll-spell-damage="handleSpellDamageRoll"
          @toggle-spell-prepared="toggleSpellPrepared"
          @toggle-innate-spell-prepared="toggleInnateSpellPrepared"
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
    </template>
  </div>
</template>
