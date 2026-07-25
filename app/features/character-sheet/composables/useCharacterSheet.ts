import type {
  AbilityKey,
  Character,
  CharacterArmorClass,
  CharacterClass,
  CharacterClassResource,
  CharacterCurrency,
  CharacterCustomCurrency,
  CharacterExtraHitDie,
  CharacterFeature,
  CharacterHealth,
  CharacterHitDie,
  CharacterInventoryItem,
  CharacterSettings,
  CharacterSpecies,
  CharacterSpeed,
  CharacterSpell,
  CharacterSpellcasting,
  CharacterVision,
  CustomInventoryItemDraft,
  CustomSpellDraft,
  ProficiencyGroupKey,
} from '../model';

import { clamp, union } from 'es-toolkit';

import {
  ABILITY_ORDER,
  ABILITY_SCORE_MAX,
  ABILITY_SCORE_MIN,
  applySkillProficiencies,
  ARMOR_CLASS_BASE_MAX,
  ARMOR_CLASS_BASE_MIN,
  CURRENCY_AMOUNT_MAX,
  CURRENCY_AMOUNT_MIN,
  CUSTOM_INVENTORY_URL_PREFIX,
  CUSTOM_SPELL_URL_PREFIX,
  DEFAULT_CHARACTER,
  downloadCharacterJson,
  EXPERIENCE_MAX,
  getAbilityRows,
  getArmorClassBreakdown,
  getArmorClassValue,
  getCarryingCapacity,
  getFormattedBonus,
  getInventoryWeight,
  getNextLevelExperience,
  getProficiencyBonus,
  getSavingThrowRows,
  getSkillRows,
  getSpellcastingBreakdown,
  getSpellSlotRows,
  INVENTORY_QUANTITY_MAX,
  INVENTORY_QUANTITY_MIN,
  isCustomInventoryItem,
  isCustomSpell,
  LEVEL_MAX,
  LEVEL_MIN,
  RESOURCE_COUNT_MAX,
  RESOURCE_COUNT_MIN,
  SHEET_HIDDEN_CONTROL_CLASS,
  SHEET_LOCKED_MESSAGE,
  SHEET_READONLY_MESSAGE,
  SKILL_PROFICIENCY_NEXT,
  toCustomInventoryItem,
  toCustomSpell,
  VISION_DISTANCE_MAX,
  VISION_DISTANCE_MIN,
} from '../model';

/**
 * Приведение количества денежной единицы к целому в допустимом диапазоне.
 *
 * @param amount введённое количество.
 * @returns целое количество в диапазоне `[CURRENCY_AMOUNT_MIN, CURRENCY_AMOUNT_MAX]`.
 */
function clampCurrencyAmount(amount: number): number {
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

  const formattedProficiencyBonus = computed(() =>
    getFormattedBonus(getProficiencyBonus(character.value.level)),
  );

  const formattedInitiative = computed(() =>
    getFormattedModifier(character.value.abilities.dexterity),
  );

  const armorClassValue = computed(() => getArmorClassValue(character.value));

  const armorClassBreakdown = computed(() =>
    getArmorClassBreakdown(character.value),
  );

  const spellcastingBreakdown = computed(() =>
    getSpellcastingBreakdown(character.value),
  );

  const spellSlotRows = computed(() => getSpellSlotRows(character.value));

  const totalWeight = computed(() =>
    getInventoryWeight(character.value.inventory),
  );

  const carryingCapacity = computed(() =>
    getCarryingCapacity(character.value.abilities.strength),
  );

  /**
   * Установка значения характеристики с ограничением допустимого диапазона.
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

    const isProficient =
      character.value.savingThrowProficiencies.includes(ability);

    character.value = {
      ...character.value,
      savingThrowProficiencies: isProficient
        ? character.value.savingThrowProficiencies.filter(
            (key) => key !== ability,
          )
        : [...character.value.savingThrowProficiencies, ability],
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
      classResources: resources.map((resource) => {
        const max = clamp(
          Math.trunc(resource.max),
          RESOURCE_COUNT_MIN,
          RESOURCE_COUNT_MAX,
        );

        return {
          ...resource,
          max,
          current: clamp(Math.trunc(resource.current), RESOURCE_COUNT_MIN, max),
        };
      }),
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
   */
  function toggleSpellSlot(level: number, index: number): void {
    if (!ensureOwnSheet()) {
      return;
    }

    const row = spellSlotRows.value.find((slotRow) => slotRow.level === level);

    if (!row) {
      return;
    }

    const used = clamp(index < row.used ? index : index + 1, 0, row.max);

    // Хранится только трата: круги без потраченных ячеек в документе не нужны.
    const otherSlots = character.value.spellSlots.filter(
      (slot) => slot.level !== level,
    );

    character.value = {
      ...character.value,
      spellSlots:
        used > 0
          ? [...otherSlots, { level, used }].sort(
              (left, right) => left.level - right.level,
            )
          : otherSlots,
    };
  }

  /**
   * Установка класса доспеха с ограничением базового значения.
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
      },
    };
  }

  /**
   * Установка уровня и суммарного опыта; порог следующего уровня берётся из
   * таблицы опыта D&D.
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
      species: { ...payload.species },
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
   * @param payload.features классовые особенности по уровню.
   */
  function setClass(payload: {
    characterClass: CharacterClass;
    savingThrows: AbilityKey[];
    hitDie: number;
    proficiencies: {
      armor: string[];
      weapons: string[];
      tools: string[];
      languages: string[];
    };
    skills: { proficient: string[]; expertise: string[] };
    features: CharacterFeature[];
  }): void {
    if (!ensureEditable()) {
      return;
    }

    const { level } = character.value;

    // Классовые особенности заменяются целиком (id `class:*`); добавленные
    // вручную сохраняются.
    const preservedFeatures = character.value.features.filter(
      (feature) => !feature.id.startsWith('class:'),
    );

    // Устаревшие производные ресурсы (id `class:res:*`) убираются, ресурсы,
    // добавленные вручную, сохраняются: класс их автоматически не создаёт.
    const preservedResources = character.value.classResources.filter(
      (resource) => !resource.id.startsWith('class:res:'),
    );

    // Владения класса объединяются с уже указанными без дублей (`union`),
    // навыки применяются через общий помощник (экспертиза перекрывает владение).
    character.value = {
      ...character.value,
      characterClass: { ...payload.characterClass },
      savingThrowProficiencies: [...payload.savingThrows],
      hitDice: [{ die: payload.hitDie, current: level, max: level }],
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
        tools: union(
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
      classResources: preservedResources,
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
   * Применение выбранной предыстории: навыки, инструмент, черта происхождения и
   * прибавки к характеристикам устанавливаются атомарно. Прибавки к
   * характеристикам и черта предыстории откатываются при смене (идемпотентно);
   * навыки и владения объединяются, ручные особенности сохраняются.
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
   */
  function setBackground(payload: {
    background: { url: string; name: string };
    abilityBonuses: Partial<Record<AbilityKey, number>>;
    skills: string[];
    tools: string[];
    featUrl: string | null;
    featFeature: CharacterFeature | null;
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

    character.value = {
      ...character.value,
      characterBackground: {
        url: payload.background.url,
        name: payload.background.name,
        featUrl: payload.featUrl,
        abilityBonuses: { ...payload.abilityBonuses },
      },
      abilities,
      proficiencies: {
        ...character.value.proficiencies,
        tools: union(character.value.proficiencies.tools, payload.tools),
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
        spell.url === spellUrl ? updatedSpell : spell,
      ),
    };
  }

  /**
   * Установка настроек заклинательства (заклинательной характеристики).
   *
   * @param spellcasting новые настройки заклинательства.
   */
  function setSpellcasting(spellcasting: CharacterSpellcasting): void {
    if (!ensureEditable()) {
      return;
    }

    character.value = {
      ...character.value,
      spellcasting: { ability: spellcasting.ability },
    };
  }

  /**
   * Установка настроек листа (правил подсчёта).
   *
   * @param settings новые настройки листа.
   */
  function setSettings(settings: CharacterSettings): void {
    if (!ensureEditable()) {
      return;
    }

    character.value = {
      ...character.value,
      settings: { weaponAttackAbility: settings.weaponAttackAbility },
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

    const updatedItem = toCustomInventoryItem(
      editedItem.url,
      draft,
      editedItem.equipped,
    );

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
   * Изменение количества предмета в пределах от одной штуки до максимума.
   * Игровое действие (трата и пополнение расходников) — блокировкой листа не
   * ограничивается; удаление предмета — отдельным экшеном.
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
      inventory: character.value.inventory.map((inventoryItem) =>
        inventoryItem.id === inventoryItemId
          ? {
              ...inventoryItem,
              quantity: clamp(
                inventoryItem.quantity + delta,
                INVENTORY_QUANTITY_MIN,
                INVENTORY_QUANTITY_MAX,
              ),
            }
          : inventoryItem,
      ),
    };
  }

  /**
   * Надеть/снять доспех: переключает `equipped` у предмета, у которого есть
   * параметры доспеха. Игровое действие (смена брони по ходу игры) — блокировкой
   * листа не ограничивается. Итоговый КД пересчитывается автоматически.
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
        inventoryItem.id === inventoryItemId && inventoryItem.armor
          ? { ...inventoryItem, equipped: !inventoryItem.equipped }
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
   * Установка заметок персонажа; значение — хранимая форма редактора разметки.
   *
   * @param notes новые заметки персонажа.
   */
  function setNotes(notes: string): void {
    if (!ensureEditable()) {
      return;
    }

    character.value = {
      ...character.value,
      notes,
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
   * Установка списка владений группы (броня, оружие или инструменты).
   *
   * @param group ключ группы владений.
   * @param items новый список владений группы.
   */
  function setProficiencies(group: ProficiencyGroupKey, items: string[]): void {
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
    formattedProficiencyBonus,
    formattedInitiative,
    armorClassValue,
    armorClassBreakdown,
    spellcastingBreakdown,
    spellSlotRows,
    totalWeight,
    carryingCapacity,
    setAbilityScore,
    setArmorClass,
    setAvatar,
    setClassResources,
    adjustClassResource,
    adjustInventoryItemQuantity,
    toggleInventoryItemEquipped,
    toggleInspiration,
    downloadCharacter,
    addFeature,
    addFeats,
    addInventoryItems,
    addCustomInventoryItem,
    addCustomSpell,
    removeFeature,
    removeInventoryItem,
    removeSpell,
    updateFeature,
    updateCustomInventoryItem,
    updateCustomSpell,
    setBackground,
    setClass,
    setCurrency,
    setName,
    setNotes,
    setProficiencies,
    setProgress,
    setSettings,
    setSize,
    setSpecies,
    setSpells,
    setSpellcasting,
    setVision,
    setSpeed,
    setHealth,
    setHitPoints,
    setHitDice,
    toggleSavingThrowProficiency,
    toggleSpellSlot,
    cycleSkillProficiency,
  };
}
