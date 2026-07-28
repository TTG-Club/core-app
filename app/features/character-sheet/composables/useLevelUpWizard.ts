import type { ComputedRef, Ref } from 'vue';

import type {
  ClassChoice,
  ClassOption,
  ClassSummary,
  HitPointsGainMode,
  LevelUpPayload,
  LevelUpStepDraft,
  LevelUpStepView,
} from '../model';

import { useDiceRoller } from '~dice-roller/composables';

import {
  buildLevelClassFeatures,
  buildSubclassFeatures,
  CLASS_SOURCES_ASYNC_DATA_KEY,
  CLASSES_DETAIL_BASE_PATH,
  CLASSES_FILTERS_PATH,
  collectChoiceSelections,
  deriveClassResources,
  filterClassOptionsBySources,
  getHitDieFormula,
  getHitDieLabel,
  getHitPointsGainForMode,
  getLevelFeatureRows,
  getLevelHitPointsGain,
  getSelectedCasterType,
  LANGUAGE_PROFICIENCY_GROUPS,
  LEVEL_UP_WIZARD_LABELS,
  mergeCharacterFeatures,
  parseClassDetail,
  parseClassOptions,
  resolveChoiceOptions,
  SUBCLASS_SELECTION_MIN_LEVEL,
  TOOL_PROFICIENCY_GROUPS,
} from '../model';
import { useLazyCatalogSourceQuery } from './useCatalogSourceQuery';
import { useCharacterSheet } from './useCharacterSheet';

/**
 * Черновики шагов по взятым уровням: прирост хитов по умолчанию средний — так
 * повышение проходит без бросков, если игрок не хочет их делать.
 *
 * @param previousLevel уровень до повышения.
 * @param targetLevel новый уровень персонажа.
 * @returns черновики шагов по возрастанию уровня.
 */
function buildLevelDrafts(
  previousLevel: number,
  targetLevel: number,
): LevelUpStepDraft[] {
  return Array.from(
    { length: targetLevel - previousLevel },
    (_, index): LevelUpStepDraft => ({
      level: previousLevel + index + 1,
      gainMode: 'average',
      roll: null,
      selections: {},
      notes: {},
    }),
  );
}

/**
 * Деталь класса или подкласса из справочника.
 *
 * @param url URL класса или подкласса.
 * @returns деталь класса; null — ответ неожиданной формы.
 */
async function fetchClassDetail(url: string): Promise<ClassSummary | null> {
  const response = await $fetch<unknown>(`${CLASSES_DETAIL_BASE_PATH}/${url}`, {
    method: 'GET',
    retry: 0,
  });

  return parseClassDetail(response);
}

/**
 * Записи словаря с известными ключами.
 *
 * @param entries словарь значений по идентификаторам.
 * @param knownIds идентификаторы, которые нужно оставить.
 * @returns словарь без записей с неизвестными ключами.
 */
function pickKnownEntries<Value>(
  entries: Record<string, Value>,
  knownIds: Set<string>,
): Record<string, Value> {
  return Object.fromEntries(
    Object.entries(entries).filter(([key]) => knownIds.has(key)),
  );
}

interface LevelUpWizard {
  /** Шаги мастера: по одному на каждый взятый уровень. */
  steps: ComputedRef<LevelUpStepView[]>;

  /** Черновики шагов: состояние контролов уровня (правятся только экшенами). */
  drafts: ComputedRef<LevelUpStepDraft[]>;

  /** Идёт загрузка деталей класса. */
  isLoading: Ref<boolean>;

  /** Детали класса загрузить не удалось — шаги недоступны. */
  hasLoadError: Ref<boolean>;

  /** Подклассы, разрешённые источниками профиля. */
  subclassOptions: ComputedRef<ClassOption[]>;

  isSubclassLoading: Ref<boolean>;

  /** Список подклассов загрузить не удалось — выбор не обязателен. */
  hasSubclassError: Ref<boolean>;

  /** URL подкласса, выбранного в мастере; null — выбора не было. */
  selectedSubclassUrl: Ref<string | null>;

  prepare: (targetLevel: number) => Promise<boolean>;
  reset: () => void;
  setGainMode: (index: number, mode: HitPointsGainMode) => void;
  rollHitDie: (index: number) => void;
  setSelection: (index: number, choiceId: string, values: string[]) => void;
  setNote: (index: number, featureId: string, value: string) => void;
  selectSubclass: (subclassUrl: string) => Promise<void>;
  choiceOptions: (choice: ClassChoice) => string[];
  isStepValid: (index: number) => boolean;
  buildPayload: (level: number, experience: number) => LevelUpPayload | null;
}

/**
 * Мастер повышения уровня: по шагу на каждый взятый уровень с собственным
 * приростом хитов, умениями класса и подкласса этого уровня и выбором подкласса
 * на пороговом уровне.
 *
 * Состояние живёт с экземпляром модалки (обычные `ref`, не `useState`): мастер
 * открывается заново на каждое повышение.
 *
 * @returns шаги мастера, действия по шагам и сборку итога для листа.
 */
export function useLevelUpWizard(): LevelUpWizard {
  const toast = useToast();

  const { character } = useCharacterSheet();

  // Кость хитов катится напрямую роллером: значение нужно здесь, чтобы
  // прибавить модификатор Телосложения именно к этому уровню.
  const { rollValue } = useDiceRoller();

  // Источники профиля грузятся вместе со списком подклассов: модалка опыта
  // должна открываться мгновенно, без ожидания сети.
  const { selectedSourceIds, load: loadSources } = useLazyCatalogSourceQuery(
    CLASS_SOURCES_ASYNC_DATA_KEY,
    CLASSES_FILTERS_PATH,
  );

  const classDetail = ref<ClassSummary | null>(null);

  const subclassDetail = ref<ClassSummary | null>(null);

  const subclassCatalog = ref<ClassOption[]>([]);

  const drafts = ref<LevelUpStepDraft[]>([]);

  const isLoading = ref(false);

  const hasLoadError = ref(false);

  const isSubclassLoading = ref(false);

  const hasSubclassError = ref(false);

  const selectedSubclassUrl = ref<string | null>(null);

  /** Уровень, под который уже собраны шаги: возврат «Назад» их не пересобирает. */
  const preparedLevel = ref<number | null>(null);

  const constitutionModifier = computed(() =>
    getModifier(character.value.abilities.constitution),
  );

  const hitDie = computed(() => character.value.characterClass?.hitDie ?? 0);

  const skillNames = computed(() =>
    character.value.skills.map((skill) => skill.name),
  );

  const proficientSkillNames = computed(() =>
    character.value.skills
      .filter((skill) => skill.proficiency !== 'none')
      .map((skill) => skill.name),
  );

  const allLanguages = computed(() =>
    LANGUAGE_PROFICIENCY_GROUPS.flatMap((group) => group.items),
  );

  const allTools = computed(() =>
    TOOL_PROFICIENCY_GROUPS.flatMap((group) => group.items),
  );

  /**
   * Уровень, на котором мастер предлагает подкласс: первый взятый уровень не
   * ниже порогового. Лист, переваливший порог без подкласса, получает выбор на
   * первом же шаге, а не теряет его совсем.
   */
  const subclassStepLevel = computed<number | null>(() => {
    if (character.value.characterClass?.subclassUrl) {
      return null;
    }

    const step = drafts.value.find(
      (draft) => draft.level >= SUBCLASS_SELECTION_MIN_LEVEL,
    );

    return step?.level ?? null;
  });

  const subclassOptions = computed(() =>
    filterClassOptionsBySources(subclassCatalog.value, selectedSourceIds.value),
  );

  /** Все выборы пикеров по идентификаторам: ключи умений сквозные между шагами. */
  const allSelections = computed<Record<string, string[]>>(() =>
    drafts.value.reduce<Record<string, string[]>>(
      (result, draft) => ({ ...result, ...draft.selections }),
      {},
    ),
  );

  /** Свободный текст выбора по идентификаторам умений. */
  const allNotes = computed<Record<string, string>>(() =>
    drafts.value.reduce<Record<string, string>>(
      (result, draft) => ({ ...result, ...draft.notes }),
      {},
    ),
  );

  const steps = computed<LevelUpStepView[]>(() =>
    drafts.value.map((draft, index) => ({
      index,
      level: draft.level,
      features: classDetail.value
        ? getLevelFeatureRows(
            classDetail.value,
            subclassDetail.value,
            draft.level,
            skillNames.value,
          )
        : [],
      isSubclassStep: draft.level === subclassStepLevel.value,
      hitPointsGain:
        hitDie.value > 0
          ? getHitPointsGainForMode(
              draft.gainMode,
              hitDie.value,
              constitutionModifier.value,
              draft.roll?.rolled ?? null,
            )
          : 0,
    })),
  );

  /** Навыки, выбранные во владение в этом мастере, — опции для компетентности. */
  const chosenProficientSkills = computed(
    () =>
      collectChoiceSelections(
        steps.value.flatMap((step) => step.features),
        allSelections.value,
      ).proficientSkills,
  );

  /** Подсказка о неудачной загрузке справочника класса. */
  function showLoadError(): void {
    toast.add({
      color: 'error',
      icon: 'tabler:alert-triangle',
      title: LEVEL_UP_WIZARD_LABELS.loadError,
    });
  }

  /**
   * Загрузка подклассов класса. Ручка `/subclasses` источники не фильтрует,
   * поэтому список отбирается на клиенте по настройке профиля.
   *
   * @param classUrl URL базового класса.
   */
  async function loadSubclasses(classUrl: string): Promise<void> {
    isSubclassLoading.value = true;
    hasSubclassError.value = false;

    try {
      const [response] = await Promise.all([
        $fetch<unknown>(`${CLASSES_DETAIL_BASE_PATH}/${classUrl}/subclasses`, {
          method: 'GET',
          retry: 0,
        }),
        loadSources(),
      ]);

      subclassCatalog.value = parseClassOptions(response, true);
    } catch (error) {
      consola.error('Ошибка загрузки подклассов:', error);
      hasSubclassError.value = true;
    } finally {
      isSubclassLoading.value = false;
    }
  }

  /**
   * Подготовка шагов: грузит деталь класса, деталь уже выбранного подкласса и,
   * если подкласс ещё не выбран, список подклассов.
   *
   * @param targetLevel новый уровень персонажа.
   * @returns true — шаги готовы; false — класса нет либо загрузка не удалась.
   */
  async function prepare(targetLevel: number): Promise<boolean> {
    const characterClass = character.value.characterClass;

    if (!characterClass || targetLevel <= character.value.level) {
      return false;
    }

    // Шаги под эту цель уже собраны: возврат с шага на форму и обратно не
    // должен стирать броски и выборы.
    if (preparedLevel.value === targetLevel && classDetail.value) {
      return true;
    }

    isLoading.value = true;
    hasLoadError.value = false;

    try {
      const [base, subclass] = await Promise.all([
        fetchClassDetail(characterClass.url),
        characterClass.subclassUrl
          ? fetchClassDetail(characterClass.subclassUrl)
          : Promise.resolve(null),
      ]);

      if (!base) {
        showLoadError();
        hasLoadError.value = true;

        return false;
      }

      classDetail.value = base;
      subclassDetail.value = subclass;
      selectedSubclassUrl.value = null;
      subclassCatalog.value = [];
      drafts.value = buildLevelDrafts(character.value.level, targetLevel);
      preparedLevel.value = targetLevel;

      if (
        !characterClass.subclassUrl
        && targetLevel >= SUBCLASS_SELECTION_MIN_LEVEL
      ) {
        await loadSubclasses(characterClass.url);
      }

      return true;
    } catch (error) {
      consola.error('Ошибка загрузки данных класса:', error);
      showLoadError();
      hasLoadError.value = true;

      return false;
    } finally {
      isLoading.value = false;
    }
  }

  /** Сброс шагов: цель повышения изменилась или мастер закрыт. */
  function reset(): void {
    drafts.value = [];
    classDetail.value = null;
    subclassDetail.value = null;
    subclassCatalog.value = [];
    selectedSubclassUrl.value = null;
    preparedLevel.value = null;
    hasLoadError.value = false;
    hasSubclassError.value = false;
  }

  /**
   * Правка черновика шага; остальные шаги не трогаются.
   *
   * @param index номер шага.
   * @param patch изменённые поля черновика.
   */
  function updateDraft(index: number, patch: Partial<LevelUpStepDraft>): void {
    drafts.value = drafts.value.map((draft, draftIndex) =>
      draftIndex === index ? { ...draft, ...patch } : draft,
    );
  }

  /**
   * Выбор способа прироста хитов на шаге.
   *
   * @param index номер шага.
   * @param mode способ прироста максимума хитов.
   */
  function setGainMode(index: number, mode: HitPointsGainMode): void {
    // Смена способа обнуляет бросок: прежнее значение к новому способу не
    // относится, а в режиме броска шаг снова ждёт кость.
    updateDraft(index, { gainMode: mode, roll: null });
  }

  /**
   * Бросок кости хитов за уровень шага; повторный бросок заменяет прежний.
   *
   * @param index номер шага.
   */
  function rollHitDie(index: number): void {
    if (hitDie.value <= 0) {
      return;
    }

    const rolled = rollValue(getHitDieFormula(hitDie.value));

    updateDraft(index, {
      roll: {
        id: crypto.randomUUID(),
        label: getHitDieLabel(hitDie.value),
        rolled,
        formattedModifier: getFormattedModifier(
          character.value.abilities.constitution,
        ),
        restored: getLevelHitPointsGain(rolled, constitutionModifier.value),
      },
    });
  }

  /**
   * Значения пикера выбора внутри умения.
   *
   * @param index номер шага.
   * @param choiceId идентификатор выбора (он же идентификатор умения).
   * @param values выбранные значения.
   */
  function setSelection(
    index: number,
    choiceId: string,
    values: string[],
  ): void {
    const draft = drafts.value[index];

    if (!draft) {
      return;
    }

    updateDraft(index, {
      selections: { ...draft.selections, [choiceId]: values },
    });
  }

  /**
   * Свободный текст выбора в умении без распознанного пикера.
   *
   * @param index номер шага.
   * @param featureId идентификатор умения.
   * @param value текст выбора.
   */
  function setNote(index: number, featureId: string, value: string): void {
    const draft = drafts.value[index];

    if (!draft) {
      return;
    }

    updateDraft(index, { notes: { ...draft.notes, [featureId]: value } });
  }

  /**
   * Выбор подкласса на его шаге: догружает деталь, после чего шаги пересобирают
   * умения подкласса. Выборы, чьи умения исчезли вместе с прежним подклассом,
   * снимаются.
   *
   * @param subclassUrl URL выбранного подкласса.
   */
  async function selectSubclass(subclassUrl: string): Promise<void> {
    if (selectedSubclassUrl.value === subclassUrl) {
      return;
    }

    isSubclassLoading.value = true;

    try {
      const detail = await fetchClassDetail(subclassUrl);

      if (!detail) {
        showLoadError();

        return;
      }

      subclassDetail.value = detail;
      selectedSubclassUrl.value = subclassUrl;
      pruneSelections();
    } catch (error) {
      consola.error('Ошибка загрузки подкласса:', error);
      showLoadError();
    } finally {
      isSubclassLoading.value = false;
    }
  }

  /** Снятие выборов и подписей, умений которых больше нет среди шагов. */
  function pruneSelections(): void {
    const knownIds = new Set(
      steps.value.flatMap((step) => step.features.map((row) => row.id)),
    );

    drafts.value = drafts.value.map((draft) => ({
      ...draft,
      selections: pickKnownEntries(draft.selections, knownIds),
      notes: pickKnownEntries(draft.notes, knownIds),
    }));
  }

  /**
   * Опции пикера по типу выбора: навыки, компетентность, языки, инструменты.
   *
   * @param choice распознанный выбор внутри умения.
   * @returns опции для селектора.
   */
  function choiceOptions(choice: ClassChoice): string[] {
    return resolveChoiceOptions(choice, {
      skillNames: skillNames.value,
      proficientSkillNames: proficientSkillNames.value,
      chosenProficientSkills: chosenProficientSkills.value,
      knownLanguages: character.value.proficiencies.languages,
      knownTools: character.value.proficiencies.tools,
      allLanguages: allLanguages.value,
      allTools: allTools.value,
    });
  }

  /**
   * Готовность шага: в режиме броска кость должна быть брошена, у распознанных
   * выборов должно быть нужное число значений (пустой список опций требование
   * снимает — иначе шаг стал бы тупиком), а на шаге подкласса он обязателен,
   * если список подклассов загрузился непустым.
   *
   * @param index номер шага.
   * @returns true — можно идти дальше.
   */
  function isStepValid(index: number): boolean {
    const step = steps.value[index];

    const draft = drafts.value[index];

    if (!step || !draft) {
      return false;
    }

    if (hitDie.value > 0 && draft.gainMode === 'roll' && !draft.roll) {
      return false;
    }

    const hasIncompleteChoice = step.features.some((row) => {
      const choice = row.choice;

      if (!choice || !choiceOptions(choice).length) {
        return false;
      }

      return (draft.selections[choice.id] ?? []).length < choice.count;
    });

    if (hasIncompleteChoice) {
      return false;
    }

    return !(
      step.isSubclassStep
      && subclassOptions.value.length > 0
      && !selectedSubclassUrl.value
    );
  }

  /**
   * Сборка итога мастера. Умения берутся за взятые уровни; выбранный здесь
   * подкласс приносит и свои умения более ранних уровней.
   *
   * @param level новый уровень персонажа.
   * @param experience суммарный опыт персонажа.
   * @returns итог для листа; null — деталь класса не загружена.
   */
  function buildPayload(
    level: number,
    experience: number,
  ): LevelUpPayload | null {
    const base = classDetail.value;

    if (!base) {
      return null;
    }

    const rows = steps.value.flatMap((step) => step.features);

    const { proficientSkills, expertiseSkills, languages, featureChoices } =
      collectChoiceSelections(rows, allSelections.value);

    const choices = { ...allNotes.value, ...featureChoices };

    const levelFeatures = drafts.value.flatMap((draft) =>
      buildLevelClassFeatures(base, subclassDetail.value, draft.level, choices),
    );

    const chosenSubclass =
      selectedSubclassUrl.value && subclassDetail.value
        ? {
            url: selectedSubclassUrl.value,
            name: subclassDetail.value.name,
            casterType: getSelectedCasterType(base, subclassDetail.value),
          }
        : null;

    const features =
      chosenSubclass && subclassDetail.value
        ? mergeCharacterFeatures(
            levelFeatures,
            buildSubclassFeatures(subclassDetail.value, level, choices),
          )
        : levelFeatures;

    return {
      level,
      experience,
      hitPointsGains: steps.value.map((step) => step.hitPointsGain),
      features,
      classResources: deriveClassResources(
        [...base.table, ...(subclassDetail.value?.table ?? [])],
        level,
      ),
      subclass: chosenSubclass,
      skills: {
        proficient: [...new Set(proficientSkills)],
        expertise: [...new Set(expertiseSkills)],
      },
      languages,
    };
  }

  return {
    steps,
    drafts: computed(() => drafts.value),
    isLoading,
    hasLoadError,
    subclassOptions,
    isSubclassLoading,
    hasSubclassError,
    selectedSubclassUrl,
    prepare,
    reset,
    setGainMode,
    rollHitDie,
    setSelection,
    setNote,
    selectSubclass,
    choiceOptions,
    isStepValid,
    buildPayload,
  };
}
