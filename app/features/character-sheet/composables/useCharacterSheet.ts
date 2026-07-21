import type {
  AbilityKey,
  Character,
  CharacterArmorClass,
  CharacterClassResource,
  CharacterExtraHitDie,
  CharacterHealth,
  CharacterHitDie,
  CharacterSpeed,
  CharacterVision,
  ProficiencyGroupKey,
} from '../model';

import { clamp } from 'es-toolkit';

import {
  ABILITY_SCORE_MAX,
  ABILITY_SCORE_MIN,
  ARMOR_CLASS_BASE_MAX,
  ARMOR_CLASS_BASE_MIN,
  DEMO_CHARACTER,
  EXPERIENCE_MAX,
  getAbilityRows,
  getArmorClassValue,
  getCarryingCapacity,
  getFormattedBonus,
  getInventoryWeight,
  getNextLevelExperience,
  getProficiencyBonus,
  getSavingThrowRows,
  getSkillRows,
  LEVEL_MAX,
  LEVEL_MIN,
  RESOURCE_COUNT_MAX,
  RESOURCE_COUNT_MIN,
  SHEET_LOCKED_MESSAGE,
  SKILL_PROFICIENCY_NEXT,
  VISION_DISTANCE_MAX,
  VISION_DISTANCE_MIN,
} from '../model';

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
    structuredClone(DEMO_CHARACTER),
  );

  const isLocked = useState<boolean>('character-sheet:locked', () => false);

  /** Переключение блокировки редактирования листа. */
  function toggleLock(): void {
    isLocked.value = !isLocked.value;
  }

  /**
   * Проверка, разрешено ли редактирование листа. При блокировке показывает
   * подсказку и возвращает false — редактирующие экшены и модалки настроек
   * должны прерываться; броски и трата ресурсов не ограничиваются.
   *
   * @returns true, если лист не заблокирован.
   */
  function ensureEditable(): boolean {
    if (!isLocked.value) {
      return true;
    }

    toast.add({
      color: 'warning',
      icon: 'tabler:lock',
      title: SHEET_LOCKED_MESSAGE,
    });

    return false;
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
    character.value = {
      ...character.value,
      inspiration: !character.value.inspiration,
    };
  }

  /**
   * Трата или восстановление заряда ресурса класса в пределах максимума.
   *
   * @param resourceId идентификатор ресурса.
   * @param delta изменение текущего значения.
   */
  function adjustClassResource(resourceId: string, delta: number): void {
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

  return {
    character,
    isLocked,
    toggleLock,
    ensureEditable,
    abilityRows,
    savingThrowRows,
    skillRows,
    formattedProficiencyBonus,
    formattedInitiative,
    armorClassValue,
    totalWeight,
    carryingCapacity,
    setAbilityScore,
    setArmorClass,
    setClassResources,
    adjustClassResource,
    toggleInspiration,
    setName,
    setProficiencies,
    setProgress,
    setVision,
    setSpeed,
    setHealth,
    setHitDice,
    toggleSavingThrowProficiency,
    cycleSkillProficiency,
  };
}
