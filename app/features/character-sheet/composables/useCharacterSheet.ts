import type {
  AbilityKey,
  Character,
  CharacterArmorClass,
  CharacterAttunement,
  CharacterCarryingCapacity,
  CharacterClass,
  CharacterClassResource,
  CharacterCurrency,
  CharacterCustomBonus,
  CharacterCustomCurrency,
  CharacterExtraHitDie,
  CharacterFeature,
  CharacterHealth,
  CharacterHitDie,
  CharacterInventoryItem,
  CharacterNote,
  CharacterPersonality,
  CharacterPreparedSpells,
  CharacterSavingThrow,
  CharacterSettings,
  CharacterSkill,
  CharacterSpecies,
  CharacterSpeed,
  CharacterSpell,
  CharacterToolProficiency,
  CharacterVision,
  CustomInventoryItemDraft,
  CustomSpellDraft,
  HitDiceAmount,
  LevelUpHitPointsGain,
  LevelUpPayload,
  PlainProficiencyGroupKey,
  PreparedSpellKind,
  SpellSlotKind,
  StartingEquipmentGrant,
} from '../model';

import { clamp, union } from 'es-toolkit';

import {
  ABILITY_ORDER,
  ABILITY_SCORE_MAX,
  ABILITY_SCORE_MIN,
  adjustHealthForConstitution,
  adjustHitDice,
  applyAbilityIncreases,
  applyLevelHitPoints,
  applySkillProficiencies,
  applyStartingEquipmentChange,
  ARMOR_CLASS_BASE_MAX,
  ARMOR_CLASS_BASE_MIN,
  ARMOR_DEX_LIMIT_MAX,
  ARMOR_DEX_LIMIT_MIN,
  ATTUNEMENT_LABELS,
  CARRYING_CAPACITY_BONUS_MAX,
  CARRYING_CAPACITY_BONUS_MIN,
  CARRYING_CAPACITY_MAX,
  CARRYING_CAPACITY_MIN,
  CATALOG_COPY_TOAST_DESCRIPTION,
  CURRENCY_AMOUNT_MAX,
  CURRENCY_AMOUNT_MIN,
  CUSTOM_INVENTORY_URL_PREFIX,
  CUSTOM_SPELL_URL_PREFIX,
  DEFAULT_CHARACTER,
  downloadCharacterJson,
  EXHAUSTION_LEVEL_MAX,
  EXHAUSTION_LEVEL_MIN,
  EXHAUSTION_LONG_REST_RECOVERY,
  EXPERIENCE_MAX,
  fetchCatalogSpellDetail,
  fetchInventoryItemDescription,
  getAbilityRows,
  getArmorClassValue,
  getAttunementBreakdown,
  getAttunementLimitDescription,
  getCarryingCapacityValue,
  getCharacterClasses,
  getCharacterProficiencyBonus,
  getClampedClassLevels,
  getClampedInteger,
  getClassLevelHitPoints,
  getEffectiveSpeed,
  getFormattedBonus,
  getInitiativeBonus,
  getInventoryWeight,
  getNextLevelExperience,
  getPreparedSpellsLimitDescription,
  getSavingThrowRows,
  getSkillRowGroups,
  getSkillRows,
  getSpellcastingBreakdown,
  getSpellPreparedKind,
  getSpellSlotRows,
  getSpellSlotsEmptyDescription,
  getStoredAttunement,
  getTotalClassLevel,
  INNATE_SPELL_COPY_TOAST_DESCRIPTION,
  INVENTORY_COPY_TOAST_TITLE,
  INVENTORY_QUANTITY_MAX,
  INVENTORY_QUANTITY_MIN,
  isActivatableInventoryItem,
  isAttunableInventoryItem,
  isCustomInventoryItem,
  isCustomSpell,
  isEquippableInventoryItem,
  isMissingInventoryItem,
  isVersatileInventoryItem,
  LEVEL_MAX,
  LEVEL_MIN,
  mergeCharacterFeatures,
  mergeClassResources,
  normalizeResourceRecoveryRule,
  PREPARED_KIND_LABELS,
  PREPARED_SPELLS_BONUS_MAX,
  PREPARED_SPELLS_BONUS_MIN,
  PREPARED_SPELLS_MAX,
  PREPARED_SPELLS_MIN,
  removeClassFeatures,
  removeClassResources,
  removeFeaturesAboveLevel,
  removeLevelHitPoints,
  RESOURCE_COUNT_MAX,
  RESOURCE_COUNT_MIN,
  RESOURCE_SHORT_LABEL_MAX_LENGTH,
  restoreClassResources,
  restoreHitDice,
  SHEET_HIDDEN_CONTROL_CLASS,
  SHEET_LOCKED_MESSAGE,
  SHEET_READONLY_MESSAGE,
  SKILL_PROFICIENCY_NEXT,
  sortAbilityKeys,
  SPELL_COPY_TOAST_TITLE,
  SPELL_SLOTS_EMPTY_TOAST_TITLE,
  syncClassHitDice,
  toCopiedInventoryItem,
  toCopiedSpell,
  toCustomInventoryItem,
  toCustomSpell,
  toStoredCustomBonuses,
  toStoredSavingThrows,
  toStoredSettings,
  toTrimmedPersonality,
  toUpdatedCustomInventoryItem,
  unionToolProficiencies,
  VISION_DISTANCE_MAX,
  VISION_DISTANCE_MIN,
  withSavingThrowProficiencies,
} from '../model';

/**
 * Приведение навыка к записи листа: название своего навыка обрезается по краям,
 * свои бонусы чистятся тем же правилом, что и бонусы настроек листа.
 *
 * @param skill навык из черновика модалки.
 * @returns навык для записи в лист.
 */
function toStoredSkill(skill: CharacterSkill): CharacterSkill {
  return {
    ...skill,
    name: skill.name.trim(),
    bonuses: toStoredCustomBonuses(skill.bonuses),
  };
}

/**
 * Приведение количества денежной единицы к целому в допустимом диапазоне.
 *
 * @param amount введённое количество.
 * @returns целое количество в диапазоне `[CURRENCY_AMOUNT_MIN, CURRENCY_AMOUNT_MAX]`.
 */
function clampCurrencyAmount(amount: number): number {
  // Очищенное поле ввода отдаёт NaN — считаем его нулём, а не сохраняем.
  if (!Number.isFinite(amount)) {
    return CURRENCY_AMOUNT_MIN;
  }

  return clamp(Math.trunc(amount), CURRENCY_AMOUNT_MIN, CURRENCY_AMOUNT_MAX);
}

/**
 * Состояние листа персонажа: реактивный персонаж, производные значения по
 * правилам D&D 2024 и экшены редактирования. Состояние разделяется между всеми
 * потребителями через `useState`.
 *
 * @returns персонаж, производные строки блоков и экшены редактирования.
 */
export function useCharacterSheet() {
  const toast = useToast();

  const character = useState<Character>('character-sheet:character', () =>
    structuredClone(DEFAULT_CHARACTER),
  );

  const isLocked = useState<boolean>('character-sheet:locked', () => false);

  /**
   * Лист открыт по ссылке «поделиться»: чужой зритель может только смотреть.
   * В отличие от {@link isLocked} снять этот режим нельзя — ставит его загрузчик
   * страницы просмотра, а на бэке ручек записи по ссылке попросту нет.
   */
  const isReadonly = useState<boolean>('character-sheet:readonly', () => false);

  /** Правки листа разрешены: лист свой и не заперт замком. */
  const canEdit = computed(() => !isReadonly.value && !isLocked.value);

  /**
   * Класс кнопок правки листа (шестерёнки, ±, карандаши, корзины, «Добавить»):
   * без прав они прячутся, но место в раскладке за собой сохраняют.
   * `undefined` — кнопка видна как обычно.
   */
  const editControlClass = computed(() =>
    canEdit.value ? undefined : SHEET_HIDDEN_CONTROL_CLASS,
  );

  /**
   * То же для кнопок игровых действий (траты ресурсов, количество предметов):
   * их запертый лист разрешает, а чужой — нет.
   */
  const gameControlClass = computed(() =>
    isReadonly.value ? SHEET_HIDDEN_CONTROL_CLASS : undefined,
  );

  /** Переключение блокировки редактирования листа. */
  function toggleLock(): void {
    // Замок чужого листа ничего не даёт: правки всё равно запрещены.
    if (isReadonly.value) {
      return;
    }

    isLocked.value = !isLocked.value;
  }

  /**
   * Проверка, разрешено ли редактирование листа. При блокировке показывает
   * подсказку и возвращает false — редактирующие экшены и модалки настроек
   * должны прерываться; броски и трата ресурсов не ограничиваются.
   *
   * @returns true, если лист доступен для правок.
   */
  function ensureEditable(): boolean {
    if (canEdit.value) {
      return true;
    }

    toast.add({
      color: 'warning',
      icon: isReadonly.value ? 'tabler:eye' : 'tabler:lock',
      title: isReadonly.value ? SHEET_READONLY_MESSAGE : SHEET_LOCKED_MESSAGE,
    });

    return false;
  }

  /**
   * Проверка для игровых действий (вдохновение, хиты, слоты, ресурсы, экипировка).
   * Запертый лист их разрешает — играть с закрытым от правок листом можно, — а
   * чужой запрещает: автосохранения у зрителя нет, и такая правка молча пропала
   * бы при перезагрузке страницы.
   *
   * @returns true, если лист свой.
   */
  function ensureOwnSheet(): boolean {
    if (!isReadonly.value) {
      return true;
    }

    toast.add({
      color: 'warning',
      icon: 'tabler:eye',
      title: SHEET_READONLY_MESSAGE,
    });

    return false;
  }

  /**
   * Перевод листа в режим просмотра по ссылке и обратно. Вызывает загрузчик:
   * страница просмотра включает режим, свои страницы — выключают.
   *
   * @param readonly включить ли режим «только просмотр».
   */
  function setReadonly(readonly: boolean): void {
    isReadonly.value = readonly;
  }

  /**
   * Загрузка сохранённого листа в общее состояние (открытие страницы листа,
   * панели или дровера).
   *
   * @param loaded персонаж из ответа API.
   */
  function loadCharacter(loaded: Character): void {
    character.value = loaded;
  }

  /**
   * Сброс состояния к пустому персонажу (уход со страницы листа), чтобы
   * следующий открытый лист не мигал данными предыдущего.
   */
  function resetCharacter(): void {
    character.value = structuredClone(DEFAULT_CHARACTER);
  }

  const abilityRows = computed(() => getAbilityRows(character.value));

  const savingThrowRows = computed(() => getSavingThrowRows(character.value));

  const skillRows = computed(() => getSkillRows(character.value));

  // Панель навыков рисует группы, а не строки: без группировки это одна общая
  // группа, поэтому разметка списка у обоих режимов одна.
  const skillGroups = computed(() =>
    getSkillRowGroups(
      skillRows.value,
      character.value.settings.groupSkillsByAbility,
    ),
  );

  const formattedProficiencyBonus = computed(() =>
    getFormattedBonus(getCharacterProficiencyBonus(character.value)),
  );

  // Бонус инициативы нужен и плиткой, и модалкой броска, поэтому наружу уходит
  // и число, и его подпись.
  const initiativeBonus = computed(() => getInitiativeBonus(character.value));

  const formattedInitiative = computed(() =>
    getFormattedBonus(initiativeBonus.value),
  );

  // Скорости листа показываются с истощением, а правятся записанные — поэтому
  // наружу уходит отдельное производное значение, а не `character.speed`.
  const effectiveSpeed = computed(() => getEffectiveSpeed(character.value));

  const armorClassValue = computed(() => getArmorClassValue(character.value));

  const spellcastingBreakdown = computed(() =>
    getSpellcastingBreakdown(character.value),
  );

  const spellSlotRows = computed(() => getSpellSlotRows(character.value));

  const totalWeight = computed(() =>
    getInventoryWeight(character.value.inventory, character.value.currency),
  );

  const carryingCapacity = computed(() =>
    getCarryingCapacityValue(character.value),
  );

  const attunement = computed(() => getAttunementBreakdown(character.value));

  /**
   * Установка значения характеристики с ограничением допустимого диапазона.
   * Смена модификатора Телосложения двигает максимум и текущие хиты: он входит
   * в максимум на каждом уровне.
   *
   * @param ability ключ характеристики.
   * @param score новое значение характеристики.
   */
  function setAbilityScore(ability: AbilityKey, score: number): void {
    if (!ensureEditable()) {
      return;
    }

    const clampedScore = clamp(
      Math.trunc(score),
      ABILITY_SCORE_MIN,
      ABILITY_SCORE_MAX,
    );

    character.value = {
      ...character.value,
      abilities: {
        ...character.value.abilities,
        [ability]: clampedScore,
      },
      health:
        ability === 'constitution'
          ? adjustHealthForConstitution(
              character.value.health,
              character.value.level,
              character.value.abilities.constitution,
              clampedScore,
            )
          : character.value.health,
    };
  }

  /**
   * Переключение владения спасброском характеристики.
   *
   * @param ability ключ характеристики.
   */
  function toggleSavingThrowProficiency(ability: AbilityKey): void {
    if (!ensureEditable()) {
      return;
    }

    character.value = {
      ...character.value,
      savingThrows: character.value.savingThrows.map((savingThrow) =>
        savingThrow.key === ability
          ? { ...savingThrow, proficient: !savingThrow.proficient }
          : savingThrow,
      ),
    };
  }

  /**
   * Установка спасбросков целиком: модалка настройки правит характеристики
   * спасбросков, их свои бонусы и общие бонусы листа, а владения приходят из
   * неё как есть.
   *
   * @param savingThrows спасброски из черновика модалки.
   * @param commonBonuses общие бонусы ко всем спасброскам из того же черновика.
   */
  function setSavingThrows(
    savingThrows: CharacterSavingThrow[],
    commonBonuses: CharacterCustomBonus[],
  ): void {
    if (!ensureEditable()) {
      return;
    }

    character.value = {
      ...character.value,
      savingThrows: toStoredSavingThrows(savingThrows),
      commonSavingThrowBonuses: toStoredCustomBonuses(commonBonuses),
    };
  }

  /**
   * Установка списка ресурсов класса: максимум и текущее значение
   * ограничиваются допустимым диапазоном.
   *
   * @param resources новый список ресурсов класса.
   */
  function setClassResources(resources: CharacterClassResource[]): void {
    if (!ensureEditable()) {
      return;
    }

    character.value = {
      ...character.value,
      // Подписи новой строки пустые (в полях только плейсхолдеры): недостающую
      // достраиваем из соседней, а строку без обеих не сохраняем — на панели
      // она осталась бы пустым рядом.
      classResources: resources
        .map((resource) => {
          const name = resource.name.trim();
          const shortLabel = resource.shortLabel.trim();

          const max = clamp(
            Math.trunc(resource.max),
            RESOURCE_COUNT_MIN,
            RESOURCE_COUNT_MAX,
          );

          return {
            ...resource,
            name: name || shortLabel,
            shortLabel:
              shortLabel || name.slice(0, RESOURCE_SHORT_LABEL_MAX_LENGTH),
            shortRest: normalizeResourceRecoveryRule(resource.shortRest, max),
            longRest: normalizeResourceRecoveryRule(resource.longRest, max),
            max,
            current: clamp(
              Math.trunc(resource.current),
              RESOURCE_COUNT_MIN,
              max,
            ),
          };
        })
        .filter((resource) => resource.shortLabel.length > 0),
    };
  }

  /**
   * Переключение вдохновения. Игровое действие — блокировкой листа не
   * ограничивается.
   */
  function toggleInspiration(): void {
    if (!ensureOwnSheet()) {
      return;
    }

    character.value = {
      ...character.value,
      inspiration: !character.value.inspiration,
    };
  }

  /**
   * Скачивание открытого листа в виде JSON-файла. Только читает состояние,
   * поэтому блокировкой листа не ограничивается.
   */
  function downloadCharacter(): void {
    downloadCharacterJson(character.value);
  }

  /**
   * Трата или восстановление заряда ресурса класса в пределах максимума.
   *
   * @param resourceId идентификатор ресурса.
   * @param delta изменение текущего значения.
   */
  function adjustClassResource(resourceId: string, delta: number): void {
    if (!ensureOwnSheet()) {
      return;
    }

    character.value = {
      ...character.value,
      classResources: character.value.classResources.map((resource) =>
        resource.id === resourceId
          ? {
              ...resource,
              current: clamp(resource.current + delta, 0, resource.max),
            }
          : resource,
      ),
    };
  }

  /**
   * Трата или возврат ячейки заклинаний круга по нажатию на кружок. Нажатие на
   * свободный кружок тратит ячейки по него включительно, на потраченный —
   * возвращает его и все следующие. Игровое действие: запертый лист его
   * разрешает, чужой (открытый по ссылке) — нет.
   *
   * @param level круг ячейки.
   * @param index порядковый номер кружка в круге (с нуля).
   * @param kind вид ячеек: обычные либо договор колдуна (у мультикласса они
   *   существуют порознь).
   */
  function toggleSpellSlot(
    level: number,
    index: number,
    kind: SpellSlotKind = 'standard',
  ): void {
    if (!ensureOwnSheet()) {
      return;
    }

    const row = spellSlotRows.value.find(
      (slotRow) => slotRow.level === level && slotRow.kind === kind,
    );

    if (!row) {
      return;
    }

    const used = clamp(index < row.used ? index : index + 1, 0, row.max);

    // Хранится только трата: круги без потраченных ячеек в документе не нужны.
    const otherSlots = character.value.spellSlots.filter(
      (slot) => slot.level !== level || slot.kind !== kind,
    );

    character.value = {
      ...character.value,
      spellSlots:
        used > 0
          ? [...otherSlots, { level, used, kind }].sort(
              (left, right) => left.level - right.level,
            )
          : otherSlots,
    };
  }

  /**
   * Трата одной ячейки круга — по факту накладывания заклинания. Занимается
   * первая свободная ячейка, как если бы игрок нажал на её кружок.
   *
   * Круги, которых класс не даёт (заговоры, незаклинатель), ячеек не тратят и
   * молчат. На чужом листе трата тоже пропускается без предупреждения: бросок
   * кубов зрителю никто не запрещает, а документ ему всё равно не сохранить.
   *
   * @param level круг заклинания.
   */
  function spendSpellSlot(level: number): void {
    const rows = spellSlotRows.value.filter(
      (slotRow) => slotRow.level === level,
    );

    if (!rows.length || isReadonly.value) {
      return;
    }

    // У мультикласса колдуна круг бывает и обычным, и договорным: тратится
    // первая ячейка со свободным местом, договор — в последнюю очередь (его
    // возвращает короткий отдых, поэтому он дороже).
    const row = rows.find((slotRow) => slotRow.used < slotRow.max);

    // Ячейки круга кончились — молча пропустить нельзя: игрок ждёт, что счётчик
    // сдвинется, и должен узнать, что тратить уже нечего.
    if (!row) {
      toast.add({
        color: 'warning',
        icon: 'tabler:sparkles',
        title: SPELL_SLOTS_EMPTY_TOAST_TITLE,
        description: getSpellSlotsEmptyDescription(level),
      });

      return;
    }

    // Хранится только трата, поэтому круг переписывается целиком.
    const otherSlots = character.value.spellSlots.filter(
      (slot) => slot.level !== level || slot.kind !== row.kind,
    );

    character.value = {
      ...character.value,
      spellSlots: [
        ...otherSlots,
        { level, used: row.used + 1, kind: row.kind },
      ].sort((left, right) => left.level - right.level),
    };
  }

  /**
   * Установка класса доспеха с ограничением базового значения и своего предела
   * бонуса Ловкости.
   *
   * @param armorClass новый класс доспеха персонажа.
   */
  function setArmorClass(armorClass: CharacterArmorClass): void {
    if (!ensureEditable()) {
      return;
    }

    character.value = {
      ...character.value,
      armorClass: {
        ...armorClass,
        base: clamp(
          Math.trunc(armorClass.base),
          ARMOR_CLASS_BASE_MIN,
          ARMOR_CLASS_BASE_MAX,
        ),
        abilities: sortAbilityKeys(armorClass.abilities),
        dexLimit:
          armorClass.dexLimit === null
            ? null
            : clamp(
                Math.trunc(armorClass.dexLimit),
                ARMOR_DEX_LIMIT_MIN,
                ARMOR_DEX_LIMIT_MAX,
              ),
      },
    };
  }

  /**
   * Установка настройки грузоподъёмности с ограничением своего значения и
   * бонуса.
   *
   * @param capacity новая настройка предела переносимого веса.
   */
  function setCarryingCapacity(capacity: CharacterCarryingCapacity): void {
    if (!ensureEditable()) {
      return;
    }

    // Числа приходят из полей модалки, поэтому клампятся общей утилитой форм:
    // очищенное поле отдаёт NaN, и без подстраховки он ушёл бы в документ.
    character.value = {
      ...character.value,
      carryingCapacity: {
        size: capacity.size,
        custom:
          capacity.custom === null
            ? null
            : getClampedInteger(
                capacity.custom,
                CARRYING_CAPACITY_MIN,
                CARRYING_CAPACITY_MAX,
              ),
        bonus: getClampedInteger(
          capacity.bonus,
          CARRYING_CAPACITY_BONUS_MIN,
          CARRYING_CAPACITY_BONUS_MAX,
        ),
      },
    };
  }

  /**
   * Установка настройки предела настроенных предметов: своё число выключает
   * подсчёт, характеристика задаёт основу вместо правила, бонус прибавляется к
   * основе подсчёта.
   *
   * @param nextAttunement новая настройка предела.
   */
  function setAttunement(nextAttunement: CharacterAttunement): void {
    if (!ensureEditable()) {
      return;
    }

    character.value = {
      ...character.value,
      attunement: getStoredAttunement(nextAttunement),
    };
  }

  /**
   * Применение новых уровней классов к листу одним изменением: общий уровень
   * становится их суммой, порог опыта берётся из таблицы D&D, кости хитов
   * пересобираются под уровни классов (потраченные остаются потраченными),
   * прирост хитов дописывается за каждый взятый уровень, а снижение уровня
   * возвращает записанный за него максимум и забирает умения снятых уровней
   * ЭТОГО класса.
   *
   * @param levels новые уровни классов по URL.
   * @param experience суммарный опыт персонажа.
   * @param hitPointsGains прирост максимума хитов за каждый взятый уровень.
   * @param patch дополнительные изменения листа (умения, ресурсы, классы).
   * @returns новый документ листа.
   */
  function withClassLevels(
    levels: Record<string, number>,
    experience: number,
    hitPointsGains: LevelUpHitPointsGain[],
    patch: Partial<Character> = {},
  ): Character {
    const source = { ...character.value, ...patch };

    const classes = getCharacterClasses(source);

    const clampedLevels = getClampedClassLevels(classes, levels);

    // Сколько уровней снимается у каждого класса: по ним возвращается максимум
    // хитов и уходят умения.
    const removedByClass = Object.fromEntries(
      classes.map((characterClass) => [
        characterClass.url,
        Math.max(
          0,
          characterClass.level - (clampedLevels[characterClass.url] ?? 0),
        ),
      ]),
    );

    const hasRemoved = Object.values(removedByClass).some((count) => count > 0);

    const withLevels = (characterClass: CharacterClass): CharacterClass => ({
      ...characterClass,
      level: clampedLevels[characterClass.url] ?? characterClass.level,
    });

    const characterClass = source.characterClass
      ? withLevels(source.characterClass)
      : null;

    const additionalClasses = source.additionalClasses.map(withLevels);

    const nextLevel = getTotalClassLevel(
      characterClass
        ? [characterClass, ...additionalClasses]
        : additionalClasses,
    );

    // Снятие и прибавка идут подряд, а не по очереди: в одном окне игрок может
    // снизить уровень одного класса и поднять другому — иначе прирост за взятые
    // уровни потерялся бы.
    const healthAfterRemoval = hasRemoved
      ? removeLevelHitPoints(source.health, removedByClass)
      : source.health;

    // Записи нумеруются общим уровнем персонажа, поэтому отсчёт идёт от того,
    // что осталось после снятия.
    const levelAfterRemoval = Math.max(0, nextLevel - hitPointsGains.length);

    const health = hitPointsGains.length
      ? applyLevelHitPoints(
          healthAfterRemoval,
          levelAfterRemoval,
          hitPointsGains,
        )
      : healthAfterRemoval;

    return {
      ...source,
      characterClass,
      additionalClasses,
      level: nextLevel,
      experience: {
        current: clamp(Math.trunc(experience), 0, EXPERIENCE_MAX),
        nextLevel: getNextLevelExperience(nextLevel),
      },
      hitDice: syncClassHitDice(
        source.hitDice,
        characterClass
          ? [characterClass, ...additionalClasses]
          : additionalClasses,
      ),
      health,
      features: hasRemoved
        ? removeFeaturesAboveLevel(source.features, clampedLevels)
        : source.features,
    };
  }

  /**
   * Установка уровней классов и суммарного опыта без мастера подготовки:
   * «Пропустить подготовку» и понижение уровня. Умения и счётчики новых уровней
   * при этом не выдаются — их добавит повторный выбор класса или следующее
   * повышение через мастер.
   *
   * @param levels новые уровни классов по URL.
   * @param experience суммарный опыт персонажа.
   * @param hitPointsGains прирост максимума хитов за каждый взятый уровень.
   */
  function setClassLevels(
    levels: Record<string, number>,
    experience: number,
    hitPointsGains: LevelUpHitPointsGain[] = [],
  ): void {
    if (!ensureEditable()) {
      return;
    }

    character.value = withClassLevels(levels, experience, hitPointsGains);
  }

  /**
   * Установка общего уровня и опыта у листа БЕЗ класса: уровень хранится сам по
   * себе, суммировать нечего. Лист с классом уровень так не меняет — там за него
   * отвечает `setClassLevels`.
   *
   * @param level новый уровень персонажа.
   * @param experience суммарный опыт персонажа.
   */
  function setProgress(level: number, experience: number): void {
    if (!ensureEditable()) {
      return;
    }

    const clampedLevel = clamp(Math.trunc(level), LEVEL_MIN, LEVEL_MAX);

    character.value = {
      ...character.value,
      level: clampedLevel,
      experience: {
        current: clamp(Math.trunc(experience), 0, EXPERIENCE_MAX),
        nextLevel: getNextLevelExperience(clampedLevel),
      },
    };
  }

  /**
   * Применение итога мастера повышения уровня одним изменением документа:
   * уровни классов с опытом, хиты по каждому взятому уровню, умения и ресурсы
   * новых уровней, выбранные подклассы и выборы внутри умений.
   *
   * В отличие от выбора класса здоровье и кости хитов не пересобираются с нуля:
   * броски на хиты и потраченные кости сохраняются. Ячейки заклинаний и бонус
   * мастерства считаются от уровня сами и здесь не участвуют.
   *
   * @param payload итог мастера повышения уровня.
   */
  function applyLevelUp(payload: LevelUpPayload): void {
    if (!ensureEditable()) {
      return;
    }

    const abilities = applyAbilityIncreases(
      character.value.abilities,
      payload.abilityIncreases,
    );

    // Мастер грузит деталь класса, поэтому заодно обновляет подкласс и
    // прогрессии подготовки: у листов, собранных до их появления, они запишутся
    // первым же повышением уровня.
    const withPatch = (characterClass: CharacterClass): CharacterClass => {
      const patch = payload.classPatches[characterClass.url];

      if (!patch) {
        return characterClass;
      }

      return {
        ...characterClass,
        subclassUrl: patch.subclass?.url ?? characterClass.subclassUrl,
        subclassName: patch.subclass?.name ?? characterClass.subclassName,
        casterType: patch.subclass
          ? patch.subclass.casterType
          : characterClass.casterType,
        preparedSpells: [...patch.preparedSpells],
        preparedCantrips: [...patch.preparedCantrips],
      };
    };

    const withLevels = withClassLevels(
      payload.classLevels,
      payload.experience,
      payload.hitPointsGains,
      {
        characterClass: character.value.characterClass
          ? withPatch(character.value.characterClass)
          : null,
        additionalClasses: character.value.additionalClasses.map(withPatch),
      },
    );

    character.value = {
      ...withLevels,
      abilities,
      // Прирост хитов за уровни считался по прежнему Телосложению, поэтому его
      // прибавка от черты применяется отдельно — она поднимает максимум на всех
      // уровнях, включая только что взятые.
      health: adjustHealthForConstitution(
        withLevels.health,
        withLevels.level,
        character.value.abilities.constitution,
        abilities.constitution,
      ),
      features: mergeCharacterFeatures(withLevels.features, payload.features),
      classResources: mergeClassResources(
        withLevels.classResources,
        payload.classResources,
      ),
      skills: applySkillProficiencies(
        withLevels.skills,
        payload.skills.proficient,
        payload.skills.expertise,
      ),
      proficiencies: {
        ...withLevels.proficiencies,
        languages: union(withLevels.proficiencies.languages, payload.languages),
      },
    };
  }

  /**
   * Установка имени персонажа; пустое имя игнорируется.
   *
   * @param name новое имя персонажа.
   */
  function setName(name: string): void {
    if (!ensureEditable()) {
      return;
    }

    const trimmedName = name.trim();

    if (!trimmedName) {
      return;
    }

    character.value = {
      ...character.value,
      name: trimmedName,
    };
  }

  /**
   * Установка изображения персонажа. Файлом в хранилище распоряжается
   * `useSheetAvatar` — здесь меняется только ссылка в документе листа.
   *
   * @param avatarUrl ссылка на изображение; null — изображения нет.
   */
  function setAvatar(avatarUrl: string | null): void {
    if (!ensureEditable()) {
      return;
    }

    character.value = {
      ...character.value,
      avatarUrl,
    };
  }

  /**
   * Установка зрения персонажа с ограничением дистанций.
   *
   * @param vision новое зрение персонажа.
   */
  function setVision(vision: CharacterVision): void {
    if (!ensureEditable()) {
      return;
    }

    character.value = {
      ...character.value,
      vision: {
        normal: clamp(vision.normal, VISION_DISTANCE_MIN, VISION_DISTANCE_MAX),
        darkvision: clamp(
          vision.darkvision,
          VISION_DISTANCE_MIN,
          VISION_DISTANCE_MAX,
        ),
        blindsight: clamp(
          vision.blindsight,
          VISION_DISTANCE_MIN,
          VISION_DISTANCE_MAX,
        ),
        tremorsense: clamp(
          vision.tremorsense,
          VISION_DISTANCE_MIN,
          VISION_DISTANCE_MAX,
        ),
        truesight: clamp(
          vision.truesight,
          VISION_DISTANCE_MIN,
          VISION_DISTANCE_MAX,
        ),
        unit: vision.unit,
      },
    };
  }

  /**
   * Установка скоростей передвижения.
   *
   * @param speed новые скорости персонажа.
   */
  function setSpeed(speed: CharacterSpeed): void {
    if (!ensureEditable()) {
      return;
    }

    character.value = {
      ...character.value,
      speed: {
        ...speed,
        values: { ...speed.values },
      },
    };
  }

  /**
   * Установка здоровья: текущие хиты не превышают максимум, значения не ниже
   * нуля.
   *
   * @param health новое здоровье персонажа.
   */
  function setHealth(health: CharacterHealth): void {
    if (!ensureEditable()) {
      return;
    }

    const max = Math.max(0, health.max);

    character.value = {
      ...character.value,
      health: {
        ...health,
        max,
        current: clamp(health.current, 0, max),
        temporary: Math.max(0, health.temporary),
      },
    };
  }

  /**
   * Быстрое изменение текущих и временных хитов в игровом режиме (модалка
   * урона/лечения из заблокированного листа). Игровое действие — блокировкой
   * листа не ограничивается. Максимум хитов не меняется; текущие ограничиваются
   * диапазоном [0, max], временные — не ниже нуля.
   *
   * @param current новые текущие хиты.
   * @param temporary новые временные хиты.
   */
  function setHitPoints(current: number, temporary: number): void {
    if (!ensureOwnSheet()) {
      return;
    }

    const { max } = character.value.health;

    character.value = {
      ...character.value,
      health: {
        ...character.value.health,
        current: clamp(Math.trunc(current), 0, max),
        temporary: Math.max(0, Math.trunc(temporary)),
      },
    };
  }

  /**
   * Установка уровня истощения (PHB 2024): уровни накопительные, шестой —
   * смертельный, ниже нуля уровень не опускается. Игровое действие —
   * блокировкой листа не ограничивается.
   *
   * @param level новый уровень истощения.
   */
  function setExhaustion(level: number): void {
    if (!ensureOwnSheet()) {
      return;
    }

    character.value = {
      ...character.value,
      health: {
        ...character.value.health,
        exhaustion: clamp(
          Math.trunc(level),
          EXHAUSTION_LEVEL_MIN,
          EXHAUSTION_LEVEL_MAX,
        ),
      },
    };
  }

  /**
   * Установка костей хитов: оставшееся количество не превышает максимум.
   *
   * @param hitDice кости хитов из классов.
   * @param extraHitDice дополнительные кости хитов.
   */
  function setHitDice(
    hitDice: CharacterHitDie[],
    extraHitDice: CharacterExtraHitDie[],
  ): void {
    if (!ensureEditable()) {
      return;
    }

    character.value = {
      ...character.value,
      hitDice: hitDice.map((hitDie) => ({
        ...hitDie,
        current: clamp(hitDie.current, 0, hitDie.max),
      })),
      extraHitDice: extraHitDice.map((hitDie) => ({
        ...hitDie,
        current: clamp(hitDie.current, 0, hitDie.max),
      })),
    };
  }

  /**
   * Трата костей хитов на отдыхе: кости выбранных номиналов списываются, а
   * текущие хиты поднимаются на восстановленное количество (в пределах
   * максимума). Бросок делает модалка отдыха — здесь применяется его итог.
   * Игровое действие — блокировкой листа не ограничивается.
   *
   * @param spent потраченные кости по номиналам.
   * @param restored восстановленные хиты по броскам.
   */
  function spendHitDice(spent: HitDiceAmount[], restored: number): void {
    if (!ensureOwnSheet()) {
      return;
    }

    const { health } = character.value;

    // Трата — отрицательное изменение остатка костей.
    const remainingDice = adjustHitDice(
      character.value.hitDice,
      character.value.extraHitDice,
      spent.map((pool) => ({ die: pool.die, count: -pool.count })),
    );

    character.value = {
      ...character.value,
      hitDice: remainingDice.hitDice,
      extraHitDice: remainingDice.extraHitDice,
      health: {
        ...health,
        current: clamp(
          health.current + Math.max(0, Math.trunc(restored)),
          0,
          health.max,
        ),
      },
    };
  }

  /**
   * Завершение короткого отдыха: ресурсам класса возвращается столько зарядов,
   * сколько задано их правилом для короткого отдыха, и восстанавливаются ячейки
   * заклинаний договора колдуна (у остальных классов ячейки возвращает только
   * продолжительный отдых). Кости хитов и хиты тратит {@link spendHitDice} —
   * отдых их не возвращает. Игровое действие — блокировкой листа не
   * ограничивается.
   */
  function completeShortRest(): void {
    if (!ensureOwnSheet()) {
      return;
    }

    // Отбор по виду, а не по кругу: у мультикласса колдуна тот же круг бывает и
    // обычным (возвращается только продолжительным отдыхом), и договорным.
    const shortRestKinds = new Set(
      spellSlotRows.value
        .filter((row) => row.recovery === 'short-rest')
        .map((row) => row.kind),
    );

    character.value = {
      ...character.value,
      classResources: restoreClassResources(
        character.value.classResources,
        'short-rest',
      ),
      // Хранится только трата ячеек, поэтому восстановление круга — это
      // удаление его записи из списка.
      spellSlots: character.value.spellSlots.filter(
        (slot) => !shortRestKinds.has(slot.kind),
      ),
    };
  }

  /**
   * Завершение продолжительного отдыха: хиты поднимаются до максимума, временные
   * хиты пропадают (держатся только до конца отдыха), возвращаются все ячейки
   * заклинаний и все потраченные кости хитов — в редакции 2024 года отдых
   * возвращает их полностью, а не половину. Счётчикам умений возвращается
   * столько зарядов, сколько задано их правилом для продолжительного отдыха.
   * Отдых снимает один уровень истощения. Игровое действие: запертый лист его
   * разрешает, чужой — нет.
   */
  function completeLongRest(): void {
    if (!ensureOwnSheet()) {
      return;
    }

    const restoredDice = restoreHitDice(
      character.value.hitDice,
      character.value.extraHitDice,
    );

    character.value = {
      ...character.value,
      hitDice: restoredDice.hitDice,
      extraHitDice: restoredDice.extraHitDice,
      health: {
        ...character.value.health,
        current: character.value.health.max,
        temporary: 0,
        exhaustion: Math.max(
          EXHAUSTION_LEVEL_MIN,
          character.value.health.exhaustion - EXHAUSTION_LONG_REST_RECOVERY,
        ),
      },
      classResources: restoreClassResources(
        character.value.classResources,
        'long-rest',
      ),
      // Хранится только трата ячеек, поэтому пустой список — все ячейки на месте.
      spellSlots: [],
    };
  }

  /**
   * Применение выбранного вида: название, размер, скорости, зрение,
   * особенности, а также выбранные владения (навыки/языки/инструменты)
   * устанавливаются атомарно одним обновлением.
   *
   * @param payload вид и производные от него значения листа.
   * @param payload.species выбранный вид с подвидом.
   * @param payload.size подпись размера; null — не распознан.
   * @param payload.speed скорости передвижения из данных вида.
   * @param payload.vision зрение из данных вида.
   * @param payload.features особенности вида и подвида.
   * @param payload.skills выбранные навыки (владение и экспертиза).
   * @param payload.skills.proficient навыки для владения.
   * @param payload.skills.expertise навыки для экспертизы.
   * @param payload.proficiencies распознанные владения из выборов вида.
   * @param payload.proficiencies.languages владения языками.
   */
  function setSpecies(payload: {
    species: CharacterSpecies;
    size: string | null;
    speed: CharacterSpeed;
    vision: CharacterVision;
    features: CharacterFeature[];
    skills: { proficient: string[]; expertise: string[] };
    proficiencies: { languages: string[] };
  }): void {
    if (!ensureEditable()) {
      return;
    }

    // Смена вида заменяет только особенности вида и подвида; добавленные
    // вручную (класс, без источника) сохраняются.
    const preservedFeatures = character.value.features.filter(
      (feature) => feature.origin !== 'species' && feature.origin !== 'lineage',
    );

    character.value = {
      ...character.value,
      species: {
        ...payload.species,
        innateSpells: payload.species.innateSpells.map((innateSpell) => ({
          ...innateSpell,
          spell: { ...innateSpell.spell },
        })),
      },
      size: payload.size,
      speed: {
        ...payload.speed,
        values: { ...payload.speed.values },
      },
      vision: { ...payload.vision },
      proficiencies: {
        ...character.value.proficiencies,
        languages: union(
          character.value.proficiencies.languages,
          payload.proficiencies.languages,
        ),
      },
      skills: applySkillProficiencies(
        character.value.skills,
        payload.skills.proficient,
        payload.skills.expertise,
      ),
      features: [
        ...payload.features.map((feature) => ({
          ...feature,
          description: [...feature.description],
        })),
        ...preservedFeatures,
      ],
    };
  }

  /**
   * Применение выбранного класса: имя (с подклассом), кость хитов, спасброски,
   * распознанные владения, производные ресурсы и классовые особенности
   * устанавливаются атомарно одним обновлением. Спасброски и кость хитов
   * перезаписываются; владения объединяются с уже имеющимися; классовые
   * особенности и производные ресурсы заменяются целиком, ручные — сохраняются.
   * Хиты пересчитываются по кости класса с модификатором Телосложения (первый
   * уровень — максимум кости, следующие — среднее) и заполняются целиком —
   * как и кости хитов, которые класс выдаёт непотраченными.
   *
   * @param payload класс и производные от него значения листа.
   * @param payload.characterClass выбранный класс с подклассом.
   * @param payload.savingThrows спасброски класса.
   * @param payload.hitDie номинал кости хитов класса.
   * @param payload.proficiencies распознанные владения (броня/оружие/инструменты/языки).
   * @param payload.proficiencies.armor владения бронёй.
   * @param payload.proficiencies.weapons владения оружием.
   * @param payload.proficiencies.tools владения инструментами.
   * @param payload.proficiencies.languages владения языками.
   * @param payload.skills выбранные навыки (владение и экспертиза).
   * @param payload.skills.proficient навыки для владения.
   * @param payload.skills.expertise навыки для экспертизы.
   * @param payload.classResources ресурсы класса из отмеченных колонок.
   * @param payload.features классовые особенности по уровню.
   * @param payload.startingEquipment выбранный вариант стартового снаряжения; null — не выдавать.
   */
  function setClass(payload: {
    // Запись выданного снаряжения ведёт сам лист, поэтому мастер её не
    // заполняет — он присылает только сам выбранный вариант.
    characterClass: Omit<CharacterClass, 'startingEquipment'>;
    savingThrows: AbilityKey[];
    hitDie: number;
    proficiencies: {
      armor: string[];
      weapons: string[];
      tools: CharacterToolProficiency[];
      languages: string[];
    };
    skills: { proficient: string[]; expertise: string[] };
    classResources: CharacterClassResource[];
    features: CharacterFeature[];
    startingEquipment: StartingEquipmentGrant | null;
  }): void {
    if (!ensureEditable()) {
      return;
    }

    const previousClass = character.value.characterClass;

    const { additionalClasses } = character.value;

    const level = clamp(
      Math.trunc(payload.characterClass.level),
      LEVEL_MIN,
      Math.max(LEVEL_MIN, LEVEL_MAX - getTotalClassLevel(additionalClasses)),
    );

    const characterClass: CharacterClass = {
      ...payload.characterClass,
      level,
      startingEquipment: null,
    };

    const modifier = getModifier(character.value.abilities.constitution);

    // Основной класс пересобирает свою долю здоровья целиком: его записи
    // прироста переписываются, чужие (второго класса) остаются на месте.
    const levelGains = [
      ...getClassLevelHitPoints(
        characterClass.url,
        payload.hitDie,
        level,
        modifier,
      ),
      ...character.value.health.levelGains.filter(
        (gain) =>
          gain.classUrl !== characterClass.url
          && gain.classUrl !== previousClass?.url,
      ),
    ];

    const maxHitPoints = levelGains.reduce(
      (total, gain) => total + gain.amount,
      0,
    );

    // Умения прежнего основного класса и нового заменяются целиком; умения
    // второго класса и добавленные вручную сохраняются.
    const preservedFeatures = removeClassFeatures(
      previousClass
        ? removeClassFeatures(character.value.features, previousClass.url)
        : character.value.features,
      characterClass.url,
    );

    // То же с производными ресурсами (`class:res:<url>:*`).
    const preservedResources = removeClassResources(
      previousClass
        ? removeClassResources(
            character.value.classResources,
            previousClass.url,
          )
        : character.value.classResources,
      characterClass.url,
    );

    // Инвентарь класс не переписывает: снимается ровно выданный прошлым выбором
    // набор, поверх ложится новый. Купленное игроком остаётся на месте.
    const startingEquipment = applyStartingEquipmentChange(
      character.value.inventory,
      character.value.currency,
      previousClass?.startingEquipment ?? null,
      payload.startingEquipment,
    );

    // Владения класса объединяются с уже указанными без дублей (`union`),
    // навыки применяются через общий помощник (экспертиза перекрывает владение).
    character.value = {
      ...character.value,
      characterClass: {
        ...characterClass,
        startingEquipment: startingEquipment.granted,
      },
      level: getTotalClassLevel([characterClass, ...additionalClasses]),
      experience: {
        ...character.value.experience,
        nextLevel: getNextLevelExperience(
          getTotalClassLevel([characterClass, ...additionalClasses]),
        ),
      },
      inventory: startingEquipment.inventory,
      currency: startingEquipment.currency,
      // Класс переписывает только владения: подменённая характеристика
      // спасброска и его свои бонусы переживают смену класса.
      savingThrows: withSavingThrowProficiencies(
        character.value.savingThrows,
        payload.savingThrows,
      ),
      // Свежий класс выдаёт свои кости непотраченными; кости второго класса
      // (другого номинала) сохраняют трату.
      hitDice: syncClassHitDice(character.value.hitDice, [
        characterClass,
        ...additionalClasses,
      ]).map((hitDie) =>
        hitDie.die === payload.hitDie
          ? { ...hitDie, current: hitDie.max }
          : hitDie,
      ),
      health: {
        ...character.value.health,
        max: maxHitPoints,
        current: maxHitPoints,
        levelGains,
      },
      proficiencies: {
        ...character.value.proficiencies,
        armor: union(
          character.value.proficiencies.armor,
          payload.proficiencies.armor,
        ),
        weapons: union(
          character.value.proficiencies.weapons,
          payload.proficiencies.weapons,
        ),
        tools: unionToolProficiencies(
          character.value.proficiencies.tools,
          payload.proficiencies.tools,
        ),
        languages: union(
          character.value.proficiencies.languages,
          payload.proficiencies.languages,
        ),
      },
      skills: applySkillProficiencies(
        character.value.skills,
        payload.skills.proficient,
        payload.skills.expertise,
      ),
      classResources: [...preservedResources, ...payload.classResources],
      features: [
        ...payload.features.map((feature) => ({
          ...feature,
          description: [...feature.description],
        })),
        ...preservedFeatures,
      ],
    };
  }

  /**
   * Добавление второго и следующего класса мультикласса на первом его уровне.
   * По правилам D&D 2024 добавленный класс НЕ даёт ни стартового снаряжения, ни
   * максимума кости хитов на своём первом уровне (это привилегия первого
   * класса), а урезанный набор владений справочник не отдаёт — их игрок
   * отмечает вручную. Общий уровень персонажа растёт на единицу.
   *
   * @param payload класс и производные от него значения листа.
   * @param payload.characterClass добавляемый класс с подклассом.
   * @param payload.hitDie номинал кости хитов класса.
   * @param payload.skills выбранные навыки (владение и экспертиза).
   * @param payload.skills.proficient навыки для владения.
   * @param payload.skills.expertise навыки для экспертизы.
   * @param payload.languages выбранные в умениях языки.
   * @param payload.classResources ресурсы класса из отмеченных колонок.
   * @param payload.features классовые особенности первого уровня.
   */
  function addClass(payload: {
    characterClass: Omit<CharacterClass, 'startingEquipment'>;
    hitDie: number;
    skills: { proficient: string[]; expertise: string[] };
    languages: string[];
    classResources: CharacterClassResource[];
    features: CharacterFeature[];
  }): void {
    if (!ensureEditable()) {
      return;
    }

    const classes = getCharacterClasses(character.value);

    // Класс уже на листе либо общий уровень исчерпан — добавлять нечего.
    if (
      !character.value.characterClass
      || classes.some((entry) => entry.url === payload.characterClass.url)
      || getTotalClassLevel(classes) >= LEVEL_MAX
    ) {
      return;
    }

    const level = clamp(
      Math.trunc(payload.characterClass.level),
      LEVEL_MIN,
      LEVEL_MAX - getTotalClassLevel(classes),
    );

    const characterClass: CharacterClass = {
      ...payload.characterClass,
      level,
      // Стартового снаряжения второй класс не даёт (правило 2024), поэтому и
      // снимать при его удалении нечего.
      startingEquipment: null,
    };

    const modifier = getModifier(character.value.abilities.constitution);

    const hitPointsGains = getClassLevelHitPoints(
      characterClass.url,
      payload.hitDie,
      level,
      modifier,
      false,
    ).map((gain) => ({ classUrl: characterClass.url, amount: gain.amount }));

    const withLevels = withClassLevels(
      { [characterClass.url]: level },
      character.value.experience.current,
      hitPointsGains,
      {
        additionalClasses: [
          ...character.value.additionalClasses,
          characterClass,
        ],
      },
    );

    character.value = {
      ...withLevels,
      skills: applySkillProficiencies(
        withLevels.skills,
        payload.skills.proficient,
        payload.skills.expertise,
      ),
      proficiencies: {
        ...withLevels.proficiencies,
        languages: union(withLevels.proficiencies.languages, payload.languages),
      },
      classResources: [...withLevels.classResources, ...payload.classResources],
      features: [
        ...payload.features.map((feature) => ({
          ...feature,
          description: [...feature.description],
        })),
        ...withLevels.features,
      ],
    };
  }

  /**
   * Удаление класса с листа: уходят его умения, производные счётчики и кости
   * хитов, а максимум хитов возвращается к записанному до него. Владения,
   * навыки и языки, однажды выданные классом, остаются — лист не помнит, кто их
   * дал, а снимать чужое опаснее, чем оставить лишнее (правится панелью
   * владений). Удаление основного класса делает основным следующий.
   *
   * @param classUrl URL удаляемого класса.
   */
  function removeClass(classUrl: string): void {
    if (!ensureEditable()) {
      return;
    }

    const removed = getCharacterClasses(character.value).find(
      (entry) => entry.url === classUrl,
    );

    if (!removed) {
      return;
    }

    // Снаряжение выдаёт только основной класс — снимаем ровно его набор.
    const startingEquipment = applyStartingEquipmentChange(
      character.value.inventory,
      character.value.currency,
      removed.startingEquipment,
      null,
    );

    // Основной класс уходит — его место занимает следующий по порядку.
    const [promoted = null, ...additionalClasses] = getCharacterClasses(
      character.value,
    ).filter((entry) => entry.url !== classUrl);

    const characterClass = promoted;

    const remainingClasses = characterClass
      ? [characterClass, ...additionalClasses]
      : additionalClasses;

    const level = getTotalClassLevel(remainingClasses);

    character.value = {
      ...character.value,
      characterClass,
      additionalClasses,
      inventory: startingEquipment.inventory,
      currency: startingEquipment.currency,
      level,
      experience: {
        ...character.value.experience,
        nextLevel: getNextLevelExperience(level),
      },
      hitDice: syncClassHitDice(character.value.hitDice, remainingClasses),
      health: removeLevelHitPoints(character.value.health, {
        [classUrl]: removed.level,
      }),
      features: removeClassFeatures(character.value.features, classUrl),
      classResources: removeClassResources(
        character.value.classResources,
        classUrl,
      ),
    };
  }

  /**
   * Применение выбранной предыстории: навыки, инструмент, черта происхождения и
   * прибавки к характеристикам устанавливаются атомарно. Прибавки к
   * характеристикам и черта предыстории откатываются при смене (идемпотентно);
   * навыки и владения объединяются, ручные особенности сохраняются. Если
   * прибавки сменили модификатор Телосложения, максимум и текущие хиты
   * двигаются вслед за ним.
   *
   * @param payload предыстория и производные значения листа.
   * @param payload.background выбранная предыстория (url, name).
   * @param payload.background.url URL предыстории.
   * @param payload.background.name название предыстории.
   * @param payload.abilityBonuses прибавки к характеристикам.
   * @param payload.skills фиксированные навыки предыстории (владение).
   * @param payload.tools владения инструментами (фикс + выбранный).
   * @param payload.featUrl URL черты происхождения; null — нет.
   * @param payload.featFeature особенность черты; null — не добавлять.
   * @param payload.startingEquipment выбранный вариант стартового снаряжения; null — не выдавать.
   */
  function setBackground(payload: {
    background: { url: string; name: string };
    abilityBonuses: Partial<Record<AbilityKey, number>>;
    skills: string[];
    tools: CharacterToolProficiency[];
    featUrl: string | null;
    featFeature: CharacterFeature | null;
    startingEquipment: StartingEquipmentGrant | null;
  }): void {
    if (!ensureEditable()) {
      return;
    }

    const previous = character.value.characterBackground;

    // Прибавки к характеристикам: снять прошлые бонусы предыстории и применить
    // новые с ограничением диапазона (без двойного начисления при смене).
    const abilities = { ...character.value.abilities };

    for (const key of ABILITY_ORDER) {
      const previousBonus = previous?.abilityBonuses[key] ?? 0;
      const nextBonus = payload.abilityBonuses[key] ?? 0;

      abilities[key] = clamp(
        character.value.abilities[key] - previousBonus + nextBonus,
        ABILITY_SCORE_MIN,
        ABILITY_SCORE_MAX,
      );
    }

    // Черта предыстории: убрать прошлую и любую копию новой, затем добавить.
    const previousFeatId = previous?.featUrl
      ? `feat:${previous.featUrl}`
      : null;

    const newFeatId = payload.featFeature?.id ?? null;

    const preservedFeatures = character.value.features.filter(
      (feature) => feature.id !== previousFeatId && feature.id !== newFeatId,
    );

    // Как и у класса: снимается ровно выданный прошлой предысторией набор,
    // поверх ложится новый — купленное игроком не трогается.
    const startingEquipment = applyStartingEquipmentChange(
      character.value.inventory,
      character.value.currency,
      previous?.startingEquipment ?? null,
      payload.startingEquipment,
    );

    character.value = {
      ...character.value,
      characterBackground: {
        url: payload.background.url,
        name: payload.background.name,
        featUrl: payload.featUrl,
        abilityBonuses: { ...payload.abilityBonuses },
        startingEquipment: startingEquipment.granted,
      },
      inventory: startingEquipment.inventory,
      currency: startingEquipment.currency,
      abilities,
      health: adjustHealthForConstitution(
        character.value.health,
        character.value.level,
        character.value.abilities.constitution,
        abilities.constitution,
      ),
      proficiencies: {
        ...character.value.proficiencies,
        tools: unionToolProficiencies(
          character.value.proficiencies.tools,
          payload.tools,
        ),
      },
      skills: applySkillProficiencies(
        character.value.skills,
        payload.skills,
        [],
      ),
      features: payload.featFeature
        ? [payload.featFeature, ...preservedFeatures]
        : preservedFeatures,
    };
  }

  /**
   * Полное редактирование особенности: название, описание, происхождение и
   * выбор игрока. Идентификатор особенности не меняется. Пустое название
   * игнорируется (особенность без названия не сохраняем).
   *
   * @param featureId идентификатор редактируемой особенности.
   * @param patch новые значения полей особенности.
   */
  function updateFeature(
    featureId: string,
    patch: Pick<
      CharacterFeature,
      'name' | 'description' | 'origin' | 'originName' | 'choice'
    >,
  ): void {
    if (!ensureEditable()) {
      return;
    }

    const name = patch.name.trim();

    if (!name) {
      return;
    }

    character.value = {
      ...character.value,
      features: character.value.features.map((feature) =>
        feature.id === featureId
          ? {
              ...feature,
              name,
              description: [...patch.description],
              origin: patch.origin,
              originName: patch.originName,
              choice: patch.choice?.trim() || null,
            }
          : feature,
      ),
    };
  }

  /**
   * Установка книги заклинаний персонажа; дубли по URL отбрасываются.
   *
   * @param spells новый список заклинаний.
   */
  function setSpells(spells: CharacterSpell[]): void {
    if (!ensureEditable()) {
      return;
    }

    const seenUrls = new Set<string>();

    character.value = {
      ...character.value,
      spells: spells
        .filter((spell) => {
          if (seenUrls.has(spell.url)) {
            return false;
          }

          seenUrls.add(spell.url);

          return true;
        })
        .map((spell) => ({ ...spell })),
    };
  }

  /**
   * Добавление своего заклинания (не из каталога). URL генерируется с
   * префиксом `custom:` — со слагами каталога он не столкнётся, а книга
   * заклинаний остаётся единым списком.
   *
   * @param draft значения формы своего заклинания.
   */
  function addCustomSpell(draft: CustomSpellDraft): void {
    if (!ensureEditable()) {
      return;
    }

    const spell = toCustomSpell(
      `${CUSTOM_SPELL_URL_PREFIX}${crypto.randomUUID()}`,
      draft,
    );

    if (!spell) {
      return;
    }

    character.value = {
      ...character.value,
      spells: [...character.value.spells, spell],
    };
  }

  /**
   * Редактирование своего заклинания; URL (идентификатор записи) не меняется.
   * Пустое название игнорируется — заклинание без названия не сохраняем.
   * Каталожные записи форма не правит: их описание живёт в разделе, а не в
   * листе, и превращать их в свои нельзя.
   *
   * @param spellUrl URL редактируемого заклинания.
   * @param draft новые значения формы.
   */
  function updateCustomSpell(spellUrl: string, draft: CustomSpellDraft): void {
    if (!ensureEditable()) {
      return;
    }

    const editedSpell = character.value.spells.find(
      (spell) => spell.url === spellUrl,
    );

    if (!editedSpell || !isCustomSpell(editedSpell)) {
      return;
    }

    const updatedSpell = toCustomSpell(spellUrl, draft);

    if (!updatedSpell) {
      return;
    }

    character.value = {
      ...character.value,
      spells: character.value.spells.map((spell) =>
        spell.url === spellUrl
          ? {
              ...updatedSpell,
              // Пометка подготовки формой не правится, поэтому переносится с
              // прежней записи: сменившийся круг лишь переносит запись в другой
              // счётчик подготовки.
              prepared: editedSpell.prepared,
            }
          : spell,
      ),
    };
  }

  /**
   * Копия каталожного заклинания в лист: запись перестаёт зависеть от раздела
   * сайта и дальше правится формой листа, как добавленная вручную. Описание и
   * характеристики дозагружаются из справочника — в документе листа у каталожных
   * записей их нет.
   *
   * @param spellUrl URL каталожного заклинания.
   */
  async function copySpellToSheet(spellUrl: string): Promise<void> {
    if (!ensureEditable()) {
      return;
    }

    const catalogSpell = character.value.spells.find(
      (spell) => spell.url === spellUrl,
    );

    if (!catalogSpell || isCustomSpell(catalogSpell)) {
      return;
    }

    const detail = await fetchCatalogSpellDetail(spellUrl);

    // Пока шёл запрос, книга могла измениться (заклинание убрали, лист закрыли
    // и открыли другой, копию уже сделал соседний клик) — перечитываем запись и
    // отступаем, если её больше нет или она уже своя.
    const currentSpell = character.value.spells.find(
      (spell) => spell.url === spellUrl,
    );

    if (!currentSpell || isCustomSpell(currentSpell)) {
      return;
    }

    const ownSpell = toCopiedSpell(
      `${CUSTOM_SPELL_URL_PREFIX}${crypto.randomUUID()}`,
      currentSpell,
      detail,
    );

    character.value = {
      ...character.value,
      spells: character.value.spells.map((spell) =>
        spell.url === spellUrl ? ownSpell : spell,
      ),
    };

    toast.add({
      color: 'success',
      icon: 'tabler:copy',
      title: SPELL_COPY_TOAST_TITLE,
      description: CATALOG_COPY_TOAST_DESCRIPTION,
    });
  }

  /**
   * Установка заклинательной характеристики класса: у мультикласса она своя у
   * каждого класса, поэтому хранится при нём, а не на всём листе.
   *
   * @param classUrl URL класса.
   * @param ability заклинательная характеристика; null — авто по названию класса.
   */
  function setSpellcastingAbility(
    classUrl: string,
    ability: AbilityKey | null,
  ): void {
    if (!ensureEditable()) {
      return;
    }

    const withAbility = (characterClass: CharacterClass): CharacterClass =>
      characterClass.url === classUrl
        ? { ...characterClass, spellcastingAbility: ability }
        : characterClass;

    character.value = {
      ...character.value,
      characterClass: character.value.characterClass
        ? withAbility(character.value.characterClass)
        : null,
      additionalClasses: character.value.additionalClasses.map(withAbility),
    };
  }

  /**
   * Установка настройки числа подготовленных заклинаний либо заговоров (у них
   * свой счётчик): своё число выключает подсчёт по таблице класса, бонус
   * прибавляется к числу класса.
   *
   * @param prepared новая настройка подготовленных.
   * @param kind вид подготовки: заклинания книги либо заговоры.
   */
  function setPreparedSpells(
    prepared: CharacterPreparedSpells,
    kind: PreparedSpellKind,
  ): void {
    if (!ensureEditable()) {
      return;
    }

    const stored: CharacterPreparedSpells = {
      custom:
        prepared.custom === null
          ? null
          : clamp(
              Math.trunc(prepared.custom),
              PREPARED_SPELLS_MIN,
              PREPARED_SPELLS_MAX,
            ),
      bonus: clamp(
        Math.trunc(prepared.bonus),
        PREPARED_SPELLS_BONUS_MIN,
        PREPARED_SPELLS_BONUS_MAX,
      ),
    };

    character.value = {
      ...character.value,
      spellcasting: {
        ...character.value.spellcasting,
        ...(kind === 'cantrips'
          ? { preparedCantrips: stored }
          : { prepared: stored }),
      },
    };
  }

  /**
   * Пометка заклинания подготовленным по нажатию на его значок (как надевание
   * доспеха в снаряжении). Больше числа из блока подготовки пометить нельзя —
   * лишнее нажатие предупреждает и ничего не меняет. Предел неизвестен (класс
   * его не даёт, своё число не задано) — пометок сколько угодно.
   *
   * Заговоры подготавливаются так же, но считаются своим счётчиком: у них своя
   * колонка таблицы класса и свой предел.
   * Игровое действие: запертый лист его разрешает, чужой — нет.
   *
   * @param spellUrl URL заклинания книги персонажа.
   */
  function toggleSpellPrepared(spellUrl: string): void {
    if (!ensureOwnSheet()) {
      return;
    }

    const currentSpell = character.value.spells.find(
      (spell) => spell.url === spellUrl,
    );

    if (!currentSpell) {
      return;
    }

    const kind = getSpellPreparedKind(currentSpell);

    const { value: limit, count } =
      kind === 'cantrips'
        ? spellcastingBreakdown.value.preparedCantrips
        : spellcastingBreakdown.value.prepared;

    // Предел уже выбран: молча пропустить нельзя — игрок ждёт, что значок
    // загорится, и должен узнать, почему этого не произошло.
    if (!currentSpell.prepared && limit !== null && count >= limit) {
      toast.add({
        color: 'warning',
        icon: 'tabler:wand',
        title: PREPARED_KIND_LABELS[kind].limitToastTitle,
        description: getPreparedSpellsLimitDescription(limit, kind),
      });

      return;
    }

    character.value = {
      ...character.value,
      spells: character.value.spells.map((spell) =>
        spell.url === spellUrl
          ? { ...spell, prepared: !spell.prepared }
          : spell,
      ),
    };
  }

  /**
   * Установка настроек листа (правил подсчёта). Свои бонусы чистятся перед
   * записью: пустое поле ввода отдаёт `NaN`, а бонусы мастерства входят в
   * каждое второе число листа.
   *
   * @param settings новые настройки листа.
   */
  function setSettings(settings: CharacterSettings): void {
    if (!ensureEditable()) {
      return;
    }

    character.value = {
      ...character.value,
      settings: toStoredSettings(settings),
    };
  }

  /**
   * Удаление заклинания из книги персонажа.
   *
   * @param spellUrl URL заклинания.
   */
  function removeSpell(spellUrl: string): void {
    if (!ensureEditable()) {
      return;
    }

    character.value = {
      ...character.value,
      spells: character.value.spells.filter((spell) => spell.url !== spellUrl),
    };
  }

  /**
   * Копия врождённого заклинания в книгу персонажа: запись перестаёт зависеть
   * и от вида, и от раздела сайта — дальше её правит форма листа. Из группы
   * врождённых заклинание при этом уходит, иначе оно осталось бы в листе
   * дважды. Характеристики и описание дозагружаются из справочника: у вида их
   * нет.
   *
   * @param spellUrl URL врождённого заклинания.
   */
  async function copyInnateSpellToSheet(spellUrl: string): Promise<void> {
    if (!ensureEditable()) {
      return;
    }

    const requestedInnateSpell = character.value.species?.innateSpells.find(
      (innateSpell) => innateSpell.spell.url === spellUrl,
    );

    if (!requestedInnateSpell) {
      return;
    }

    const detail = await fetchCatalogSpellDetail(spellUrl);

    // Пока шёл запрос, вид могли сменить или заклинание убрать — перечитываем
    // запись и отступаем, если её больше нет.
    const species = character.value.species;

    const currentInnateSpell = species?.innateSpells.find(
      (innateSpell) => innateSpell.spell.url === spellUrl,
    );

    if (!species || !currentInnateSpell) {
      return;
    }

    const ownSpell = toCopiedSpell(
      `${CUSTOM_SPELL_URL_PREFIX}${crypto.randomUUID()}`,
      currentInnateSpell.spell,
      detail,
    );

    character.value = {
      ...character.value,
      species: {
        ...species,
        innateSpells: species.innateSpells.filter(
          (innateSpell) => innateSpell.spell.url !== spellUrl,
        ),
      },
      spells: [...character.value.spells, ownSpell],
    };

    toast.add({
      color: 'success',
      icon: 'tabler:copy',
      title: SPELL_COPY_TOAST_TITLE,
      description: INNATE_SPELL_COPY_TOAST_DESCRIPTION,
    });
  }

  /**
   * Удаление врождённого заклинания вида: запись выбрасывается из самого вида,
   * иначе она вернулась бы на следующем повышении уровня. Заново получить её
   * можно, ещё раз выбрав вид в мастере.
   *
   * @param spellUrl URL врождённого заклинания.
   */
  function removeInnateSpell(spellUrl: string): void {
    if (!ensureEditable()) {
      return;
    }

    const species = character.value.species;

    if (!species) {
      return;
    }

    character.value = {
      ...character.value,
      species: {
        ...species,
        innateSpells: species.innateSpells.filter(
          (innateSpell) => innateSpell.spell.url !== spellUrl,
        ),
      },
    };
  }

  /**
   * Добавление предметов инвентаря из каталога раздела «Предметы».
   * Идентификаторы устойчивы (`item:url`), поэтому уже добавленные предметы
   * отбрасываются.
   *
   * @param inventoryItems предметы с готовыми идентификаторами.
   */
  function addInventoryItems(inventoryItems: CharacterInventoryItem[]): void {
    if (!ensureEditable()) {
      return;
    }

    const existingIds = new Set(
      character.value.inventory.map((inventoryItem) => inventoryItem.id),
    );

    const freshItems = inventoryItems.filter(
      (inventoryItem) => !existingIds.has(inventoryItem.id),
    );

    if (!freshItems.length) {
      return;
    }

    character.value = {
      ...character.value,
      inventory: [
        ...character.value.inventory,
        ...freshItems.map((inventoryItem) => ({ ...inventoryItem })),
      ],
    };
  }

  /**
   * Добавление своего предмета (заполненного формой, а не выбранного из
   * разделов сайта). Идентификатор генерируется с префиксом `custom:` — со
   * слагами каталога он не столкнётся, а инвентарь остаётся единым списком.
   *
   * @param draft значения формы своего предмета.
   */
  function addCustomInventoryItem(draft: CustomInventoryItemDraft): void {
    if (!ensureEditable()) {
      return;
    }

    const inventoryItem = toCustomInventoryItem(
      `${CUSTOM_INVENTORY_URL_PREFIX}${crypto.randomUUID()}`,
      draft,
    );

    if (!inventoryItem) {
      return;
    }

    character.value = {
      ...character.value,
      inventory: [...character.value.inventory, inventoryItem],
    };
  }

  /**
   * Редактирование своего предмета; идентификатор записи не меняется, надетый
   * доспех остаётся надетым. Пустое название игнорируется — предмет без названия
   * не сохраняем. Каталожные записи форма не правит: их описание живёт в
   * разделе-источнике, а не в листе.
   *
   * @param inventoryItemId идентификатор предмета инвентаря.
   * @param draft новые значения формы.
   */
  function updateCustomInventoryItem(
    inventoryItemId: string,
    draft: CustomInventoryItemDraft,
  ): void {
    if (!ensureEditable()) {
      return;
    }

    const editedItem = character.value.inventory.find(
      (inventoryItem) => inventoryItem.id === inventoryItemId,
    );

    if (!editedItem || !isCustomInventoryItem(editedItem)) {
      return;
    }

    const updatedItem = toUpdatedCustomInventoryItem(editedItem, draft);

    if (!updatedItem) {
      return;
    }

    character.value = {
      ...character.value,
      inventory: character.value.inventory.map((inventoryItem) =>
        inventoryItem.id === inventoryItemId ? updatedItem : inventoryItem,
      ),
    };
  }

  /**
   * Копия каталожного предмета в лист — то же, что и у заклинания: запись
   * становится своей (количество, надетый доспех и параметры сохраняются), а
   * описание переезжает из справочника в лист.
   *
   * @param inventoryItemId идентификатор предмета инвентаря.
   */
  async function copyInventoryItemToSheet(
    inventoryItemId: string,
  ): Promise<void> {
    if (!ensureEditable()) {
      return;
    }

    const catalogItem = character.value.inventory.find(
      (inventoryItem) => inventoryItem.id === inventoryItemId,
    );

    if (!catalogItem || isCustomInventoryItem(catalogItem)) {
      return;
    }

    const description = await fetchInventoryItemDescription(catalogItem);

    // Инвентарь за время запроса мог измениться — перечитываем предмет, как в
    // {@link copySpellToSheet}.
    const currentItem = character.value.inventory.find(
      (inventoryItem) => inventoryItem.id === inventoryItemId,
    );

    if (!currentItem || isCustomInventoryItem(currentItem)) {
      return;
    }

    const ownItem = toCopiedInventoryItem(
      `${CUSTOM_INVENTORY_URL_PREFIX}${crypto.randomUUID()}`,
      currentItem,
      description,
    );

    character.value = {
      ...character.value,
      inventory: character.value.inventory.map((inventoryItem) =>
        inventoryItem.id === inventoryItemId ? ownItem : inventoryItem,
      ),
    };

    toast.add({
      color: 'success',
      icon: 'tabler:copy',
      title: INVENTORY_COPY_TOAST_TITLE,
      description: CATALOG_COPY_TOAST_DESCRIPTION,
    });
  }

  /**
   * Удаление предмета из инвентаря.
   *
   * @param inventoryItemId идентификатор предмета инвентаря.
   */
  function removeInventoryItem(inventoryItemId: string): void {
    if (!ensureEditable()) {
      return;
    }

    character.value = {
      ...character.value,
      inventory: character.value.inventory.filter(
        (inventoryItem) => inventoryItem.id !== inventoryItemId,
      ),
    };
  }

  /**
   * Изменение количества предмета в пределах от нуля до максимума. Игровое
   * действие (трата и пополнение расходников) — блокировкой листа не
   * ограничивается; удаление предмета — отдельным экшеном. Обнулённый доспех
   * снимается: предмета у персонажа нет, и в КД он идти не должен.
   *
   * @param inventoryItemId идентификатор предмета инвентаря.
   * @param delta изменение количества.
   */
  function adjustInventoryItemQuantity(
    inventoryItemId: string,
    delta: number,
  ): void {
    if (!ensureOwnSheet()) {
      return;
    }

    character.value = {
      ...character.value,
      inventory: character.value.inventory.map((inventoryItem) => {
        if (inventoryItem.id !== inventoryItemId) {
          return inventoryItem;
        }

        const quantity = clamp(
          inventoryItem.quantity + delta,
          INVENTORY_QUANTITY_MIN,
          INVENTORY_QUANTITY_MAX,
        );

        return {
          ...inventoryItem,
          quantity,
          equipped: quantity > 0 && inventoryItem.equipped,
        };
      }),
    };
  }

  /**
   * Надеть/снять предмет: переключает `equipped` у того, что вообще надевается
   * — доспеха, щита, плаща защиты и любого магического предмета (кольцо и амулет
   * бронёй не являются, но носятся). Игровое действие (смена брони по ходу игры)
   * — блокировкой листа не ограничивается. Итоговый КД пересчитывается
   * автоматически. Отсутствующий предмет (количество — ноль) надеть нельзя.
   *
   * @param inventoryItemId идентификатор предмета инвентаря.
   */
  function toggleInventoryItemEquipped(inventoryItemId: string): void {
    if (!ensureOwnSheet()) {
      return;
    }

    character.value = {
      ...character.value,
      inventory: character.value.inventory.map((inventoryItem) =>
        inventoryItem.id === inventoryItemId
        && isEquippableInventoryItem(inventoryItem)
        && !isMissingInventoryItem(inventoryItem)
          ? { ...inventoryItem, equipped: !inventoryItem.equipped }
          : inventoryItem,
      ),
    };
  }

  /**
   * Настроиться на предмет или снять настройку. Игровое действие — блокировкой
   * листа не ограничивается. Предлагается только там, где каталог назвал
   * настройку обязательной; отсутствующий предмет настройки не держит.
   *
   * Больше предела из плитки снаряжения настроиться нельзя — лишнее нажатие
   * предупреждает и ничего не меняет. Нужно больше настроек, чем даёт правило
   * (три предмета), — предел поднимается в его настройке.
   *
   * @param inventoryItemId идентификатор предмета инвентаря.
   */
  function toggleInventoryItemAttuned(inventoryItemId: string): void {
    if (!ensureOwnSheet()) {
      return;
    }

    const currentItem = character.value.inventory.find(
      (inventoryItem) => inventoryItem.id === inventoryItemId,
    );

    if (!currentItem) {
      return;
    }

    const { value: limit, count } = attunement.value;

    // Предел уже занят: молча пропустить нельзя — игрок ждёт, что предмет
    // настроится, и должен узнать, почему этого не произошло. Предупреждаем
    // только там, где настройка вообще предлагается: у прочих предметов
    // нажатию и без предела делать нечего.
    if (
      !currentItem.attuned
      && isAttunableInventoryItem(currentItem)
      && !isMissingInventoryItem(currentItem)
      && count >= limit
    ) {
      toast.add({
        color: 'warning',
        icon: ATTUNEMENT_LABELS.icon,
        title: ATTUNEMENT_LABELS.limitToastTitle,
        description: getAttunementLimitDescription(limit),
      });

      return;
    }

    character.value = {
      ...character.value,
      inventory: character.value.inventory.map((inventoryItem) =>
        inventoryItem.id === inventoryItemId
        && isAttunableInventoryItem(inventoryItem)
        && !isMissingInventoryItem(inventoryItem)
          ? { ...inventoryItem, attuned: !inventoryItem.attuned }
          : inventoryItem,
      ),
    };
  }

  /**
   * Включить или выключить магический предмет — для свойств, которые работают
   * не постоянно. Игровое действие — блокировкой листа не ограничивается.
   * Отсутствующий предмет включать нечем.
   *
   * @param inventoryItemId идентификатор предмета инвентаря.
   */
  function toggleInventoryItemActive(inventoryItemId: string): void {
    if (!ensureOwnSheet()) {
      return;
    }

    character.value = {
      ...character.value,
      inventory: character.value.inventory.map((inventoryItem) =>
        inventoryItem.id === inventoryItemId
        && isActivatableInventoryItem(inventoryItem)
        && !isMissingInventoryItem(inventoryItem)
          ? { ...inventoryItem, active: !inventoryItem.active }
          : inventoryItem,
      ),
    };
  }

  /**
   * Трата и возврат зарядов предмета. Игровое действие — блокировкой листа не
   * ограничивается. Остаток держится в пределах от нуля до максимума: за
   * границы его не уводят ни быстрые нажатия, ни правка предмета в разделе.
   *
   * @param inventoryItemId идентификатор предмета инвентаря.
   * @param delta изменение остатка зарядов.
   */
  function adjustInventoryItemCharges(
    inventoryItemId: string,
    delta: number,
  ): void {
    if (!ensureOwnSheet()) {
      return;
    }

    character.value = {
      ...character.value,
      inventory: character.value.inventory.map((inventoryItem) => {
        if (inventoryItem.id !== inventoryItemId || !inventoryItem.charges) {
          return inventoryItem;
        }

        const { current, max } = inventoryItem.charges;

        return {
          ...inventoryItem,
          charges: { current: clamp(current + delta, 0, max), max },
        };
      }),
    };
  }

  /**
   * Восстановление всех зарядов предмета (рассвет, отдых). Игровое действие —
   * блокировкой листа не ограничивается.
   *
   * @param inventoryItemId идентификатор предмета инвентаря.
   */
  function restoreInventoryItemCharges(inventoryItemId: string): void {
    if (!ensureOwnSheet()) {
      return;
    }

    character.value = {
      ...character.value,
      inventory: character.value.inventory.map((inventoryItem) =>
        inventoryItem.id === inventoryItemId && inventoryItem.charges
          ? {
              ...inventoryItem,
              charges: {
                ...inventoryItem.charges,
                current: inventoryItem.charges.max,
              },
            }
          : inventoryItem,
      ),
    };
  }

  /**
   * Смена хвата универсального оружия: взять его двумя руками (урон катится
   * большей костью) или вернуть в одну. Игровое действие — блокировкой листа не
   * ограничивается. У остального снаряжения хвата нет: переключать нечего.
   *
   * @param inventoryItemId идентификатор предмета инвентаря.
   */
  function toggleInventoryItemTwoHanded(inventoryItemId: string): void {
    if (!ensureOwnSheet()) {
      return;
    }

    character.value = {
      ...character.value,
      inventory: character.value.inventory.map((inventoryItem) =>
        inventoryItem.id === inventoryItemId
        && isVersatileInventoryItem(inventoryItem)
          ? { ...inventoryItem, twoHanded: !inventoryItem.twoHanded }
          : inventoryItem,
      ),
    };
  }

  /**
   * Добавление особенности вручную; идентификатор генерируется.
   *
   * @param feature особенность без идентификатора.
   */
  function addFeature(feature: Omit<CharacterFeature, 'id'>): void {
    if (!ensureEditable()) {
      return;
    }

    character.value = {
      ...character.value,
      features: [
        ...character.value.features,
        { ...feature, id: `custom:${crypto.randomUUID()}` },
      ],
    };
  }

  /**
   * Добавление особенностей из каталога (черты раздела «Черты»). Идентификаторы
   * устойчивы (`feat:url`), поэтому уже добавленные черты отбрасываются.
   *
   * @param features особенности с готовыми идентификаторами.
   */
  function addFeats(features: CharacterFeature[]): void {
    if (!ensureEditable()) {
      return;
    }

    const existingIds = new Set(
      character.value.features.map((feature) => feature.id),
    );

    const freshFeatures = features.filter(
      (feature) => !existingIds.has(feature.id),
    );

    if (!freshFeatures.length) {
      return;
    }

    character.value = {
      ...character.value,
      features: [
        ...character.value.features,
        ...freshFeatures.map((feature) => ({
          ...feature,
          description: [...feature.description],
        })),
      ],
    };
  }

  /**
   * Удаление особенности персонажа с листа.
   *
   * @param featureId идентификатор особенности.
   */
  function removeFeature(featureId: string): void {
    if (!ensureEditable()) {
      return;
    }

    character.value = {
      ...character.value,
      features: character.value.features.filter(
        (feature) => feature.id !== featureId,
      ),
    };
  }

  /**
   * Добавление заметки в конец списка. Пустая запись (без заголовка и текста)
   * не добавляется.
   *
   * @param note заголовок и текст заметки в хранимой форме редактора разметки.
   */
  function addNote(note: Omit<CharacterNote, 'id'>): void {
    if (!ensureEditable()) {
      return;
    }

    const title = note.title.trim();

    const content = note.content.trim();

    if (!title && !content) {
      return;
    }

    character.value = {
      ...character.value,
      notes: [
        ...character.value.notes,
        { id: crypto.randomUUID(), title, content },
      ],
    };
  }

  /**
   * Правка заметки; опустошённая запись (без заголовка и текста) не сохраняется.
   *
   * @param noteId идентификатор заметки.
   * @param patch новые заголовок и текст заметки.
   */
  function updateNote(noteId: string, patch: Omit<CharacterNote, 'id'>): void {
    if (!ensureEditable()) {
      return;
    }

    const title = patch.title.trim();

    const content = patch.content.trim();

    if (!title && !content) {
      return;
    }

    character.value = {
      ...character.value,
      notes: character.value.notes.map((note) =>
        note.id === noteId ? { ...note, title, content } : note,
      ),
    };
  }

  /**
   * Удаление заметки.
   *
   * @param noteId идентификатор заметки.
   */
  function removeNote(noteId: string): void {
    if (!ensureEditable()) {
      return;
    }

    character.value = {
      ...character.value,
      notes: character.value.notes.filter((note) => note.id !== noteId),
    };
  }

  /**
   * Установка личности персонажа: приметы, мировоззрение и подробное описание.
   * Правят её две модалки, каждая своей частью, поэтому обе присылают личность
   * целиком — поверх текущей. Пробелы по краям снимаются: строка из одних
   * пробелов выглядела бы на плитке заполненным полем.
   *
   * @param personality личность персонажа целиком.
   */
  function setPersonality(personality: CharacterPersonality): void {
    if (!ensureEditable()) {
      return;
    }

    character.value = {
      ...character.value,
      personality: toTrimmedPersonality(personality),
    };
  }

  /**
   * Установка размера персонажа.
   *
   * @param size русская подпись размера; null — размер не указан.
   */
  function setSize(size: string | null): void {
    if (!ensureEditable()) {
      return;
    }

    character.value = {
      ...character.value,
      size,
    };
  }

  /**
   * Установка списка владений группы (броня, оружие, мастерство или языки).
   * Инструменты хранятся записями со ссылкой — у них свой сеттер.
   *
   * @param group ключ группы владений.
   * @param items новый список владений группы.
   */
  function setProficiencies(
    group: PlainProficiencyGroupKey,
    items: string[],
  ): void {
    if (!ensureEditable()) {
      return;
    }

    character.value = {
      ...character.value,
      proficiencies: {
        ...character.value.proficiencies,
        [group]: [...items],
      },
    };
  }

  /**
   * Установка владений инструментами: помимо названия хранится ссылка на
   * предмет каталога, чтобы его описание открывалось из листа.
   *
   * @param tools новый список владений инструментами.
   */
  function setToolProficiencies(tools: CharacterToolProficiency[]): void {
    if (!ensureEditable()) {
      return;
    }

    character.value = {
      ...character.value,
      proficiencies: {
        ...character.value.proficiencies,
        tools: tools.map((tool) => ({ ...tool })),
      },
    };
  }

  /**
   * Переключение уровня владения навыком по кругу: нет → половина → владение →
   * экспертиза → нет.
   *
   * @param skillName название навыка.
   */
  function cycleSkillProficiency(skillName: string): void {
    if (!ensureEditable()) {
      return;
    }

    character.value = {
      ...character.value,
      skills: character.value.skills.map((skill) =>
        skill.name === skillName
          ? { ...skill, proficiency: SKILL_PROFICIENCY_NEXT[skill.proficiency] }
          : skill,
      ),
    };
  }

  /**
   * Установка навыков целиком: модалка настройки правит характеристики навыков
   * и их дополнительные бонусы, а уровни владения приходят из неё как есть.
   * Группировка списка приходит оттуда же и пишется вместе с навыками — обе
   * правки применяются одной кнопкой, значит и в лист уходят одной записью.
   *
   * @param skills навыки из черновика модалки.
   * @param groupedByAbility выводить ли навыки группами по характеристикам.
   */
  function setSkills(
    skills: CharacterSkill[],
    groupedByAbility: boolean,
  ): void {
    if (!ensureEditable()) {
      return;
    }

    character.value = {
      ...character.value,
      skills: skills.map(toStoredSkill),
      settings: {
        ...character.value.settings,
        groupSkillsByAbility: groupedByAbility,
      },
    };
  }

  /**
   * Установка кошелька: количества стандартных монет ограничиваются диапазоном;
   * пользовательские валюты обрезаются по краям, их количество ограничивается, а
   * записи без сокращения (нечего показать в ряду) отбрасываются.
   *
   * @param currency количества пяти стандартных денежных единиц.
   * @param customCurrencies пользовательские денежные единицы.
   */
  function setCurrency(
    currency: CharacterCurrency,
    customCurrencies: CharacterCustomCurrency[],
  ): void {
    if (!ensureEditable()) {
      return;
    }

    character.value = {
      ...character.value,
      currency: {
        copper: clampCurrencyAmount(currency.copper),
        silver: clampCurrencyAmount(currency.silver),
        electrum: clampCurrencyAmount(currency.electrum),
        gold: clampCurrencyAmount(currency.gold),
        platinum: clampCurrencyAmount(currency.platinum),
      },
      customCurrencies: customCurrencies
        .map((customCurrency) => ({
          id: customCurrency.id,
          name: customCurrency.name.trim(),
          label: customCurrency.label.trim(),
          amount: clampCurrencyAmount(customCurrency.amount),
        }))
        .filter((customCurrency) => customCurrency.label.length > 0),
    };
  }

  return {
    character,
    isLocked,
    isReadonly,
    canEdit,
    editControlClass,
    gameControlClass,
    toggleLock,
    setReadonly,
    ensureEditable,
    loadCharacter,
    resetCharacter,
    abilityRows,
    savingThrowRows,
    skillRows,
    skillGroups,
    formattedProficiencyBonus,
    initiativeBonus,
    formattedInitiative,
    effectiveSpeed,
    armorClassValue,
    spellcastingBreakdown,
    spellSlotRows,
    totalWeight,
    carryingCapacity,
    attunement,
    setAbilityScore,
    setArmorClass,
    setCarryingCapacity,
    setAttunement,
    setAvatar,
    setClassResources,
    adjustClassResource,
    adjustInventoryItemQuantity,
    toggleInventoryItemEquipped,
    toggleInventoryItemAttuned,
    toggleInventoryItemActive,
    adjustInventoryItemCharges,
    restoreInventoryItemCharges,
    toggleInventoryItemTwoHanded,
    toggleInspiration,
    downloadCharacter,
    addFeature,
    addFeats,
    addNote,
    applyLevelUp,
    addInventoryItems,
    addCustomInventoryItem,
    addCustomSpell,
    copyInnateSpellToSheet,
    copyInventoryItemToSheet,
    copySpellToSheet,
    removeFeature,
    removeInnateSpell,
    removeInventoryItem,
    removeNote,
    removeSpell,
    updateFeature,
    updateNote,
    updateCustomInventoryItem,
    updateCustomSpell,
    setBackground,
    setClass,
    addClass,
    removeClass,
    setClassLevels,
    setCurrency,
    setName,
    setPersonality,
    setProficiencies,
    setSavingThrows,
    setSkills,
    setToolProficiencies,
    setProgress,
    setSettings,
    setSize,
    setSpecies,
    setSpells,
    setSpellcastingAbility,
    setPreparedSpells,
    setVision,
    setSpeed,
    setHealth,
    setHitPoints,
    setExhaustion,
    setHitDice,
    spendHitDice,
    completeShortRest,
    completeLongRest,
    spendSpellSlot,
    toggleSavingThrowProficiency,
    toggleSpellPrepared,
    toggleSpellSlot,
    cycleSkillProficiency,
  };
}
