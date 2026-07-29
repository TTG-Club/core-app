import type { ComputedRef, Ref } from 'vue';

import type {
  AbilityKey,
  CharacterFeature,
  ClassChoice,
  ClassOption,
  ClassSummary,
  FeatSelectOption,
  HitPointsGainMode,
  LevelUpFeatChoice,
  LevelUpPayload,
  LevelUpStepDraft,
  LevelUpStepView,
} from '../model';

import { useDiceRoller } from '~dice-roller/composables';

import {
  ABILITY_IMPROVEMENT_FEATURE_ID_SEGMENT,
  ABILITY_IMPROVEMENT_LABELS,
  buildFeatFeature,
  buildLevelClassFeatures,
  buildSubclassFeatures,
  CLASS_SOURCES_ASYNC_DATA_KEY,
  CLASSES_DETAIL_BASE_PATH,
  CLASSES_FILTERS_PATH,
  collectChoiceSelections,
  collectFeatAbilityIncreases,
  deriveClassResources,
  derivePreparedSpellsScaling,
  FEAT_SOURCES_ASYNC_DATA_KEY,
  FEATS_FILTERS_PATH,
  FEATS_SELECT_PATH,
  fetchFeatDetail,
  filterClassOptionsBySources,
  getAbilityImprovementFeatOptions,
  getFeatUrlFromFeatureId,
  getHitDieFormula,
  getHitDieLabel,
  getHitPointsGainForMode,
  getLevelFeatureRows,
  getLevelHitPointsGain,
  getSelectedCasterType,
  getToolNames,
  LANGUAGE_PROFICIENCY_GROUPS,
  LEVEL_UP_WIZARD_LABELS,
  mergeAbilityIncreases,
  mergeCharacterFeatures,
  parseClassDetail,
  parseClassOptions,
  parseFeatSelectOptions,
  resolveChoiceOptions,
  SUBCLASS_SELECTION_MIN_LEVEL,
} from '../model';
import { useLazyCatalogSourceQuery } from './useCatalogSourceQuery';
import { useCharacterSheet } from './useCharacterSheet';
import { useToolCatalog } from './useToolCatalog';

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
      featChoices: {},
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

  /** Черты каталога загружаются — селектор выбора черты ещё пуст. */
  isFeatsLoading: Ref<boolean>;

  /** Список черт загрузить не удалось — выбор черты недоступен. */
  hasFeatsError: Ref<boolean>;

  prepare: (targetLevel: number) => Promise<boolean>;
  reset: () => void;
  setGainMode: (index: number, mode: HitPointsGainMode) => void;
  rollHitDie: (index: number) => void;
  setSelection: (index: number, choiceId: string, values: string[]) => void;
  setNote: (index: number, featureId: string, value: string) => void;
  setFeatChoice: (index: number, featureId: string, featUrl: string) => void;
  setFeatAbility: (
    index: number,
    featureId: string,
    slot: number,
    ability: AbilityKey | null,
  ) => void;
  selectSubclass: (subclassUrl: string) => Promise<void>;
  choiceOptions: (choice: ClassChoice) => string[];

  /** Черты, доступные для выбора в умении шага. */
  featOptions: (index: number, featureId: string) => FeatSelectOption[];

  /** Выбранная в умении черта; null — выбора не было либо черта неизвестна. */
  selectedFeat: (index: number, featureId: string) => FeatSelectOption | null;

  isStepValid: (index: number) => boolean;

  /**
   * Сборка итога мастера: догружает описания выбранных черт, поэтому
   * асинхронна. null — деталь класса не загружена или черта не догрузилась.
   */
  buildPayload: (
    level: number,
    experience: number,
  ) => Promise<LevelUpPayload | null>;
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

  // Источники черт живут в своём разделе, поэтому и фильтры у них свои. Ключ
  // общий с модалкой черт — ответ переиспользуется.
  const { selectedSourceIds: selectedFeatSourceIds, load: loadFeatSources } =
    useLazyCatalogSourceQuery(FEAT_SOURCES_ASYNC_DATA_KEY, FEATS_FILTERS_PATH);

  const classDetail = ref<ClassSummary | null>(null);

  const subclassDetail = ref<ClassSummary | null>(null);

  const subclassCatalog = ref<ClassOption[]>([]);

  const drafts = ref<LevelUpStepDraft[]>([]);

  const isLoading = ref(false);

  const hasLoadError = ref(false);

  const isSubclassLoading = ref(false);

  const hasSubclassError = ref(false);

  const selectedSubclassUrl = ref<string | null>(null);

  /** Черты каталога для выбора за улучшение характеристик. */
  const featCatalog = ref<FeatSelectOption[]>([]);

  const isFeatsLoading = ref(false);

  const hasFeatsError = ref(false);

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

  // Инструменты умения уровня не выдают (`detectFeatureChoice` их не
  // распознаёт), но контекст резолва выборов общий — список берём из каталога
  // сайта, своего перечня инструментов у листа нет.
  const { getToolNamesForGroups, load: loadToolCatalog } = useToolCatalog();

  void loadToolCatalog();

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

  /** Url черт, уже взятых на листе: повторно они не предлагаются. */
  const takenFeatUrls = computed(
    () =>
      new Set(
        character.value.features.flatMap((feature) => {
          const url = getFeatUrlFromFeatureId(feature.id);

          return url ? [url] : [];
        }),
      ),
  );

  /** Все выборы черт мастера по идентификаторам умений (ключи сквозные). */
  const allFeatChoices = computed<Record<string, LevelUpFeatChoice>>(() =>
    drafts.value.reduce<Record<string, LevelUpFeatChoice>>(
      (result, draft) => ({ ...result, ...draft.featChoices }),
      {},
    ),
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
   * Загрузка каталога черт для умений улучшения характеристик. Список берётся
   * целиком с `/select`: только он отдаёт повторяемость и прибавки к
   * характеристикам, а фильтрация категорий и уже взятых черт идёт на клиенте.
   */
  async function loadFeats(): Promise<void> {
    isFeatsLoading.value = true;
    hasFeatsError.value = false;

    try {
      const [response] = await Promise.all([
        $fetch<unknown>(FEATS_SELECT_PATH, { method: 'GET', retry: 0 }),
        loadFeatSources(),
      ]);

      featCatalog.value = parseFeatSelectOptions(response);
    } catch (error) {
      consola.error(ABILITY_IMPROVEMENT_LABELS.applyErrorLog, error);
      hasFeatsError.value = true;
    } finally {
      isFeatsLoading.value = false;
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

      // Каталог черт нужен только когда взятые уровни дают улучшение
      // характеристик: иначе лишний запрос на каждое повышение.
      const hasFeatChoice = steps.value.some((step) =>
        step.features.some((row) => row.abilityImprovement),
      );

      if (hasFeatChoice) {
        await loadFeats();
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
    featCatalog.value = [];
    hasFeatsError.value = false;
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
   * Выбор черты за улучшение характеристик. Смена черты обнуляет выбранные
   * характеристики: у новой черты свой список и своё число прибавок.
   *
   * @param index номер шага.
   * @param featureId идентификатор классового умения.
   * @param featUrl url выбранной черты; '' — выбор снят.
   */
  function setFeatChoice(
    index: number,
    featureId: string,
    featUrl: string,
  ): void {
    const draft = drafts.value[index];

    if (!draft) {
      return;
    }

    const option = featCatalog.value.find((feat) => feat.url === featUrl);

    updateDraft(index, {
      featChoices: {
        ...draft.featChoices,
        [featureId]: {
          featUrl,
          abilities: Array.from<AbilityKey | null>({
            length: option?.abilityIncreaseCount ?? 0,
          }).fill(null),
        },
      },
    });
  }

  /**
   * Выбор характеристики в слоте прибавки выбранной черты.
   *
   * @param index номер шага.
   * @param featureId идентификатор классового умения.
   * @param slot номер слота прибавки (с нуля).
   * @param ability выбранная характеристика; null — выбор снят.
   */
  function setFeatAbility(
    index: number,
    featureId: string,
    slot: number,
    ability: AbilityKey | null,
  ): void {
    const draft = drafts.value[index];

    const choice = draft?.featChoices[featureId];

    if (!draft || !choice) {
      return;
    }

    updateDraft(index, {
      featChoices: {
        ...draft.featChoices,
        [featureId]: {
          ...choice,
          abilities: choice.abilities.map((current, currentSlot) =>
            currentSlot === slot ? ability : current,
          ),
        },
      },
    });
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
      knownTools: getToolNames(character.value.proficiencies.tools),
      allLanguages: allLanguages.value,
      allTools: getToolNamesForGroups(choice.toolGroups),
    });
  }

  /**
   * Черты, доступные в умении шага: из каталога уходят черты запрещённых
   * категорий, уже взятые на листе и выбранные на других шагах мастера.
   *
   * @param index номер шага.
   * @param featureId идентификатор классового умения.
   * @returns черты для селектора.
   */
  function featOptions(index: number, featureId: string): FeatSelectOption[] {
    const selectedUrl = drafts.value[index]?.featChoices[featureId]?.featUrl;

    // Черты, занятые другими умениями этого же мастера, тоже недоступны:
    // повышение на несколько уровней даёт выбор не по одному разу.
    const chosenElsewhere = Object.entries(allFeatChoices.value)
      .filter(([id, choice]) => id !== featureId && choice.featUrl)
      .map(([, choice]) => choice.featUrl);

    return getAbilityImprovementFeatOptions(
      featCatalog.value,
      new Set([...takenFeatUrls.value, ...chosenElsewhere]),
      selectedUrl ?? '',
      selectedFeatSourceIds.value,
    );
  }

  /**
   * Черта, выбранная в умении шага.
   *
   * @param index номер шага.
   * @param featureId идентификатор классового умения.
   * @returns опция черты; null — выбора не было либо черта не из каталога.
   */
  function selectedFeat(
    index: number,
    featureId: string,
  ): FeatSelectOption | null {
    const featUrl = drafts.value[index]?.featChoices[featureId]?.featUrl;

    if (!featUrl) {
      return null;
    }

    return featCatalog.value.find((feat) => feat.url === featUrl) ?? null;
  }

  /**
   * Готовность выборов черт на шаге: у каждого умения улучшения характеристик
   * должна быть выбрана черта, а у черты с прибавками — заполнены все слоты
   * характеристик. Неудачная загрузка каталога требование снимает — иначе шаг
   * стал бы тупиком.
   *
   * @param step шаг мастера.
   * @param draft черновик шага.
   * @returns true — все выборы черт заполнены.
   */
  function areFeatChoicesComplete(
    step: LevelUpStepView,
    draft: LevelUpStepDraft,
  ): boolean {
    if (hasFeatsError.value) {
      return true;
    }

    return step.features
      .filter((row) => row.abilityImprovement)
      .every((row) => {
        const choice = draft.featChoices[row.id];

        if (!choice?.featUrl) {
          return false;
        }

        return choice.abilities.every((ability) => ability !== null);
      });
  }

  /**
   * Готовность шага: в режиме броска кость должна быть брошена, у распознанных
   * выборов должно быть нужное число значений (пустой список опций требование
   * снимает — иначе шаг стал бы тупиком), выборы черт заполнены, а на шаге
   * подкласса подкласс обязателен, если список подклассов загрузился непустым.
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

    if (hasIncompleteChoice || !areFeatChoicesComplete(step, draft)) {
      return false;
    }

    return !(
      step.isSubclassStep
      && subclassOptions.value.length > 0
      && !selectedSubclassUrl.value
    );
  }

  /**
   * Особенности выбранных за улучшение характеристик черт: описание черты
   * догружается из справочника (в каталоге `/select` его нет). Идентификатор
   * привязан к классовому умению, поэтому снятие уровня забирает черту вместе
   * с умением, а повторный выбор той же черты на другом уровне не схлопывается.
   *
   * @returns особенности черт и подписи выбора по идентификаторам умений.
   */
  async function buildChosenFeatFeatures(): Promise<{
    features: CharacterFeature[];
    choiceLabels: Record<string, string>;
  }> {
    // Уровень берётся из шага, на котором сделан выбор: по нему снятие уровня
    // забирает черту вместе с давшим её умением.
    const entries = drafts.value.flatMap((draft) =>
      Object.entries(draft.featChoices)
        .filter(([, choice]) => choice.featUrl)
        .map(([featureId, choice]) => ({
          featureId,
          featUrl: choice.featUrl,
          level: draft.level,
        })),
    );

    const summaries = await Promise.all(
      entries.map((entry) => fetchFeatDetail(entry.featUrl)),
    );

    const features: CharacterFeature[] = [];
    const choiceLabels: Record<string, string> = {};

    for (const [index, entry] of entries.entries()) {
      const summary = summaries[index];

      if (!summary) {
        continue;
      }

      features.push({
        ...buildFeatFeature(summary),
        id: `${entry.featureId}:${ABILITY_IMPROVEMENT_FEATURE_ID_SEGMENT}:${summary.url}`,
        level: entry.level,
      });

      choiceLabels[entry.featureId] = summary.name;
    }

    return { features, choiceLabels };
  }

  /**
   * Сборка итога мастера. Умения берутся за взятые уровни; выбранный здесь
   * подкласс приносит и свои умения более ранних уровней. Выбранные черты
   * догружаются из справочника, поэтому сборка асинхронна.
   *
   * @param level новый уровень персонажа.
   * @param experience суммарный опыт персонажа.
   * @returns итог для листа; null — деталь класса не загружена либо черту
   *   загрузить не удалось.
   */
  async function buildPayload(
    level: number,
    experience: number,
  ): Promise<LevelUpPayload | null> {
    const base = classDetail.value;

    if (!base) {
      return null;
    }

    const chosenFeatCount = Object.values(allFeatChoices.value).filter(
      (choice) => choice.featUrl,
    ).length;

    let featFeatures: CharacterFeature[] = [];
    let featChoiceLabels: Record<string, string> = {};

    try {
      const chosen = await buildChosenFeatFeatures();

      featFeatures = chosen.features;
      featChoiceLabels = chosen.choiceLabels;
    } catch (error) {
      consola.error(ABILITY_IMPROVEMENT_LABELS.applyErrorLog, error);

      return null;
    }

    // Часть черт не загрузилась: применять повышение с потерянной чертой
    // нельзя — игрок остался бы без выбранного и без предупреждения.
    if (featFeatures.length < chosenFeatCount) {
      return null;
    }

    const rows = steps.value.flatMap((step) => step.features);

    const { proficientSkills, expertiseSkills, languages, featureChoices } =
      collectChoiceSelections(rows, allSelections.value);

    const choices = {
      ...allNotes.value,
      ...featureChoices,
      ...featChoiceLabels,
    };

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

    const classFeatures =
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
      features: [...classFeatures, ...featFeatures],
      classResources: deriveClassResources(
        [...base.table, ...(subclassDetail.value?.table ?? [])],
        level,
      ),
      preparedSpells: derivePreparedSpellsScaling([
        ...base.table,
        ...(subclassDetail.value?.table ?? []),
      ]),
      subclass: chosenSubclass,
      skills: {
        proficient: [...new Set(proficientSkills)],
        expertise: [...new Set(expertiseSkills)],
      },
      languages,
      abilityIncreases: mergeAbilityIncreases(
        Object.values(allFeatChoices.value).map((choice) =>
          collectFeatAbilityIncreases(choice.abilities),
        ),
      ),
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
    isFeatsLoading,
    hasFeatsError,
    prepare,
    reset,
    setGainMode,
    rollHitDie,
    setSelection,
    setNote,
    setFeatChoice,
    setFeatAbility,
    selectSubclass,
    choiceOptions,
    featOptions,
    selectedFeat,
    isStepValid,
    buildPayload,
  };
}
