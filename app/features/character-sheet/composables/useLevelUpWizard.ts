import type { ComputedRef, Ref } from 'vue';

import type {
  AbilityImprovementMode,
  AbilityKey,
  CharacterAbilities,
  CharacterClass,
  CharacterClassResource,
  CharacterFeature,
  ClassChoice,
  ClassFeatureRow,
  ClassOption,
  ClassSummary,
  FeatSelectOption,
  HitPointsGainMode,
  LevelUpAbilityImprovement,
  LevelUpClassPatch,
  LevelUpFeatChoice,
  LevelUpPayload,
  LevelUpStepDraft,
  LevelUpStepView,
  LevelUpTarget,
  LevelUpWizardStep,
} from '../model';

import { omit } from 'es-toolkit';

import { useDiceRoller } from '~dice-roller/composables';

import {
  ABILITY_IMPROVEMENT_LABELS,
  ABILITY_IMPROVEMENT_STEP_LABELS,
  ABILITY_LABELS,
  buildAbilityImprovementFeature,
  buildFeatFeature,
  buildLevelClassFeatures,
  buildSubclassFeatures,
  CLASS_FEAT_CHOICE_ID_SEGMENT,
  CLASS_GRANTED_FEAT_ID_SEGMENT,
  CLASS_SOURCES_ASYNC_DATA_KEY,
  CLASSES_DETAIL_BASE_PATH,
  CLASSES_FILTERS_PATH,
  collectChoiceSelections,
  collectFeatAbilityIncreases,
  DEFAULT_ABILITY_IMPROVEMENT,
  deriveCantripsScaling,
  deriveClassResources,
  derivePreparedSpellsScaling,
  FEAT_SOURCES_ASYNC_DATA_KEY,
  FEATS_FILTERS_PATH,
  FEATS_SELECT_PATH,
  fetchFeatDetail,
  filterClassOptionsBySources,
  getAbilityImprovementSpent,
  getCharacterClasses,
  getChoiceSkillHints,
  getEffectiveAbilities,
  getFeatChoiceOptions,
  getFeatUrlFromFeatureId,
  getHitDieFormula,
  getHitDieLabel,
  getHitPointsGainForMode,
  getLevelFeatureRows,
  getLevelHitPointsGain,
  getOwnedWeaponNames,
  getRequiredChoiceCount,
  getSelectedCasterType,
  getTakenOptionValues,
  getToolNames,
  isAbilityImprovementComplete,
  isAbilityImprovementFeatChoice,
  LANGUAGE_PROFICIENCY_GROUPS,
  LEVEL_SHORT_SUFFIX,
  LEVEL_UP_WIZARD_LABELS,
  mergeAbilityIncreases,
  mergeCharacterFeatures,
  parseClassDetail,
  parseClassOptions,
  parseFeatSelectOptions,
  resolveChoiceOptions,
  SUBCLASS_SELECTION_MIN_LEVEL,
  withAbilityImprovementStep,
  withPendingAbilityIncreases,
  withStoredFeatureAnswers,
} from '../model';
import { useLazyCatalogSourceQuery } from './useCatalogSourceQuery';
import { useCharacterSheet } from './useCharacterSheet';
import { useToolCatalog } from './useToolCatalog';

/** Загруженные справочные данные класса, взятые в мастере. */
interface LoadedClass {
  /** Класс на листе — из него берутся кость хитов и уже выбранный подкласс. */
  entry: CharacterClass;

  /** Деталь класса из справочника. */
  detail: ClassSummary;

  /** Деталь подкласса; null — подкласс не выбран. */
  subclass: ClassSummary | null;

  /** Подклассы для выбора; пусто — выбор не нужен либо список не загрузился. */
  subclassOptions: ClassOption[];

  /**
   * Уровень В КЛАССЕ, на котором мастер предлагает подкласс; null — подкласс уже
   * выбран либо взятые уровни до порога не дотягивают.
   */
  subclassStepLevel: number | null;
}

/**
 * Черновики шагов по взятым уровням: прирост хитов по умолчанию средний — так
 * повышение проходит без бросков, если игрок не хочет их делать. Шаги идут по
 * классам в порядке их следования на листе, внутри класса — по возрастанию
 * уровня; общий уровень персонажа растёт сквозным счётом.
 *
 * @param targets повышения уровня по классам.
 * @param previousLevel общий уровень персонажа до повышения.
 * @returns черновики шагов по порядку.
 */
function buildLevelDrafts(
  targets: LevelUpTarget[],
  previousLevel: number,
): LevelUpStepDraft[] {
  const drafts: LevelUpStepDraft[] = [];

  let level = previousLevel;

  for (const target of targets) {
    for (
      let classLevel = target.from + 1;
      classLevel <= target.to;
      classLevel++
    ) {
      level += 1;

      drafts.push({
        classUrl: target.classUrl,
        classLevel,
        level,
        gainMode: 'average',
        roll: null,
        selections: {},
        notes: {},
        featChoices: {},
        abilityImprovements: {},
      });
    }
  }

  return drafts;
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

/**
 * Ключ подготовленных шагов: по нему возврат на форму и обратно не пересобирает
 * броски и выборы, а смена цели повышения — пересобирает.
 *
 * @param targets повышения уровня по классам.
 * @returns ключ цели.
 */
function getTargetsKey(targets: LevelUpTarget[]): string {
  return targets
    .map((target) => `${target.classUrl}:${target.from}-${target.to}`)
    .join('|');
}

/**
 * Строки умений уровня с повышением характеристик: их выборы спрашиваются
 * отдельным шагом, а не карточкой умения среди остальных.
 *
 * @param step шаг мастера.
 * @returns строки повышения характеристик; пусто — уровень их не даёт.
 */
function getAbilityImprovementRows(step: LevelUpStepView): ClassFeatureRow[] {
  return step.features.filter((row) => row.abilityImprovement);
}

/**
 * Выборы черты повышения характеристик на шаге: у каждого свой ответ игрока.
 *
 * @param step шаг мастера.
 * @returns выборы черты строк повышения.
 */
function getAbilityImprovementChoices(step: LevelUpStepView): ClassChoice[] {
  return getAbilityImprovementRows(step).flatMap((row) => row.featChoices);
}

interface LevelUpWizard {
  /** Шаги мастера: по одному на каждый взятый уровень. */
  steps: ComputedRef<LevelUpStepView[]>;

  /**
   * Шаги в порядке показа: уровень, а следом — его повышение характеристик,
   * если уровень его даёт.
   */
  wizardSteps: ComputedRef<LevelUpWizardStep[]>;

  /** Черновики шагов: состояние контролов уровня (правятся только экшенами). */
  drafts: ComputedRef<LevelUpStepDraft[]>;

  /**
   * Характеристики, от которых считается предел повышения: итоговые плюс всё,
   * что уже разложено в мастере другими повышениями и чертами.
   */
  abilityScoresFor: (choiceId: string) => CharacterAbilities;

  /** Идёт загрузка деталей классов. */
  isLoading: Ref<boolean>;

  /** Детали класса загрузить не удалось — шаги недоступны. */
  hasLoadError: Ref<boolean>;

  /** Подклассы класса шага, разрешённые источниками профиля. */
  subclassOptions: (index: number) => ClassOption[];

  isSubclassLoading: Ref<boolean>;

  /** Список подклассов загрузить не удалось — выбор не обязателен. */
  hasSubclassError: Ref<boolean>;

  /** URL подкласса, выбранного в мастере для класса шага; null — выбора не было. */
  selectedSubclassUrl: (index: number) => string | null;

  /** Черты каталога загружаются — селектор выбора черты ещё пуст. */
  isFeatsLoading: Ref<boolean>;

  /** Список черт загрузить не удалось — выбор черты недоступен. */
  hasFeatsError: Ref<boolean>;

  prepare: (targets: LevelUpTarget[]) => Promise<boolean>;
  reset: () => void;
  setGainMode: (index: number, mode: HitPointsGainMode) => void;
  rollHitDie: (index: number) => void;
  setSelection: (index: number, choiceId: string, values: string[]) => void;
  setNote: (index: number, featureId: string, value: string) => void;
  setFeatChoice: (
    index: number,
    featureId: string,
    choiceId: string,
    featUrl: string,
  ) => void;
  setFeatAbility: (
    index: number,
    choiceId: string,
    slot: number,
    ability: AbilityKey | null,
  ) => void;

  /** Ответ на повышение характеристик шага; не задан — режим прибавок без прибавок. */
  abilityImprovement: (
    index: number,
    choiceId: string,
  ) => LevelUpAbilityImprovement;

  /** Смена режима повышения: прибавки к характеристикам или черта вместо них. */
  setAbilityImprovementMode: (
    index: number,
    choiceId: string,
    mode: AbilityImprovementMode,
  ) => void;

  /** Шаг ± у характеристики в режиме прибавок. */
  stepAbilityImprovement: (
    index: number,
    choiceId: string,
    ability: AbilityKey,
    delta: number,
  ) => void;

  /** Сброс разложенных прибавок повышения. */
  resetAbilityImprovement: (index: number, choiceId: string) => void;

  selectSubclass: (index: number, subclassUrl: string) => Promise<void>;
  choiceOptions: (choice: ClassChoice) => string[];

  /** Пометки опций пикера: навыки, которыми персонаж уже владеет. */
  choiceHints: (choice: ClassChoice) => Record<string, string>;

  /** Черты, доступные выбору черты в умении шага. */
  featOptions: (index: number, choice: ClassChoice) => FeatSelectOption[];

  /** Выбранная черта; null — выбора не было либо черта неизвестна. */
  selectedFeat: (index: number, choiceId: string) => FeatSelectOption | null;

  isStepValid: (index: number) => boolean;

  /**
   * Сборка итога мастера: догружает описания выбранных черт, поэтому
   * асинхронна. null — детали классов не загружены или черта не догрузилась.
   */
  buildPayload: (experience: number) => Promise<LevelUpPayload | null>;
}

/**
 * Мастер повышения уровня: по шагу на каждый взятый уровень с собственным
 * приростом хитов, умениями класса и подкласса этого уровня и выбором подкласса
 * на пороговом уровне В КЛАССЕ. У мультикласса уровни разных классов идут
 * шагами подряд, каждый со своим классом.
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

  /** Загруженные классы по их URL. */
  const loadedClasses = ref<Record<string, LoadedClass>>({});

  const drafts = ref<LevelUpStepDraft[]>([]);

  const isLoading = ref(false);

  const hasLoadError = ref(false);

  const isSubclassLoading = ref(false);

  const hasSubclassError = ref(false);

  /** Выбранные в мастере подклассы по URL класса. */
  const selectedSubclasses = ref<Record<string, string>>({});

  /** Черты каталога для выбора за улучшение характеристик. */
  const featCatalog = ref<FeatSelectOption[]>([]);

  const isFeatsLoading = ref(false);

  const hasFeatsError = ref(false);

  /** Цель, под которую уже собраны шаги: возврат «Назад» их не пересобирает. */
  const preparedKey = ref<string | null>(null);

  const constitutionModifier = computed(() =>
    getModifier(character.value.abilities.constitution),
  );

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
    drafts.value.map((draft, index) => {
      const loaded = loadedClasses.value[draft.classUrl];

      const hitDie = loaded?.entry.hitDie ?? 0;

      return {
        index,
        level: draft.level,
        classUrl: draft.classUrl,
        className: loaded?.entry.name ?? '',
        classLevel: draft.classLevel,
        hitDie,
        features: loaded
          ? getLevelFeatureRows(
              loaded.detail,
              loaded.subclass,
              draft.classLevel,
              skillNames.value,
            )
          : [],
        isSubclassStep: draft.classLevel === loaded?.subclassStepLevel,
        hitPointsGain:
          hitDie > 0
            ? getHitPointsGainForMode(
                draft.gainMode,
                hitDie,
                constitutionModifier.value,
                draft.roll?.rolled ?? null,
              )
            : 0,
      };
    }),
  );

  /**
   * Шаги в порядке показа: повышение характеристик идёт своим шагом сразу за
   * уровнем, который его дал, — так карточки умений уровня остаются
   * компактными, а повышение спрашивается целиком и на виду.
   */
  const wizardSteps = computed<LevelUpWizardStep[]>(() =>
    steps.value.flatMap((step) => {
      const levelStep: LevelUpWizardStep = {
        key: 'level',
        draftIndex: step.index,
        level: step.level,
        title: `${step.level} ${LEVEL_SHORT_SUFFIX}`,
      };

      if (getAbilityImprovementChoices(step).length === 0) {
        return [levelStep];
      }

      return [
        levelStep,
        {
          key: 'abilities',
          draftIndex: step.index,
          level: step.level,
          title: ABILITY_IMPROVEMENT_STEP_LABELS.stepTitle,
        },
      ];
    }),
  );

  /** Итоговые характеристики персонажа: от них считаются прибавки и предел. */
  const abilityScores = computed(() => getEffectiveAbilities(character.value));

  /** Все выборы мастера: по ним считается, что уже взято из общего списка. */
  const allChoices = computed<ClassChoice[]>(() =>
    steps.value.flatMap((step) => step.features.flatMap((row) => row.choices)),
  );

  /**
   * Ответы мастера, дополненные ответами прошлых уровней с самих записей листа.
   *
   * Умение, у которого на этом уровне открывается ещё одна ступень выбора,
   * пересобирается целиком и заменяет прежнюю запись: без прежних ответов оно
   * потеряло бы и выбранное раньше — воззвания первого уровня у колдуна,
   * оружейные приёмы первого уровня у воина.
   */
  const allAnswers = computed<Record<string, string[]>>(() =>
    Object.values(loadedClasses.value).reduce<Record<string, string[]>>(
      (result, loaded) =>
        withStoredFeatureAnswers(
          result,
          character.value.features,
          loaded.entry.url,
          [...loaded.detail.features, ...(loaded.subclass?.features ?? [])],
        ),
      allSelections.value,
    ),
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
   * @returns опции подклассов; пусто — загрузить не удалось.
   */
  async function loadSubclasses(classUrl: string): Promise<ClassOption[]> {
    isSubclassLoading.value = true;

    try {
      const [response] = await Promise.all([
        $fetch<unknown>(`${CLASSES_DETAIL_BASE_PATH}/${classUrl}/subclasses`, {
          method: 'GET',
          retry: 0,
        }),
        loadSources(),
      ]);

      return parseClassOptions(response, true);
    } catch (error) {
      consola.error('Ошибка загрузки подклассов:', error);
      hasSubclassError.value = true;

      return [];
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
   * Загрузка справочных данных одного класса, уровень в котором растёт.
   *
   * @param target повышение уровня в классе.
   * @returns загруженный класс; null — класса нет на листе либо ответ битый.
   */
  async function loadClass(target: LevelUpTarget): Promise<LoadedClass | null> {
    const entry = getCharacterClasses(character.value).find(
      (characterClass) => characterClass.url === target.classUrl,
    );

    if (!entry) {
      return null;
    }

    const [detail, subclass] = await Promise.all([
      fetchClassDetail(entry.url),
      entry.subclassUrl ? fetchClassDetail(entry.subclassUrl) : null,
    ]);

    if (!detail) {
      return null;
    }

    // Подкласс предлагается на первом взятом уровне не ниже порогового: класс,
    // переваливший порог без подкласса, получает выбор на первом же шаге, а не
    // теряет его совсем.
    const subclassStepLevel = entry.subclassUrl
      ? null
      : (Array.from(
          { length: target.to - target.from },
          (_step, index) => target.from + index + 1,
        ).find((classLevel) => classLevel >= SUBCLASS_SELECTION_MIN_LEVEL)
        ?? null);

    return {
      entry,
      detail,
      subclass,
      subclassOptions:
        subclassStepLevel === null ? [] : await loadSubclasses(entry.url),
      subclassStepLevel,
    };
  }

  /**
   * Подготовка шагов: грузит детали классов, уровень в которых растёт, детали
   * уже выбранных подклассов и, если подкласс ещё не выбран, списки подклассов.
   *
   * @param targets повышения уровня по классам.
   * @returns true — шаги готовы; false — классов нет либо загрузка не удалась.
   */
  async function prepare(targets: LevelUpTarget[]): Promise<boolean> {
    const growing = targets.filter((target) => target.to > target.from);

    if (!growing.length) {
      return false;
    }

    const key = getTargetsKey(growing);

    // Шаги под эту цель уже собраны: возврат с шага на форму и обратно не
    // должен стирать броски и выборы.
    if (preparedKey.value === key) {
      return true;
    }

    isLoading.value = true;
    hasLoadError.value = false;
    hasSubclassError.value = false;

    try {
      const loaded = await Promise.all(growing.map(loadClass));

      if (loaded.includes(null)) {
        showLoadError();
        hasLoadError.value = true;

        return false;
      }

      loadedClasses.value = Object.fromEntries(
        loaded
          .filter((entry): entry is LoadedClass => entry !== null)
          .map((entry) => [entry.entry.url, entry]),
      );

      selectedSubclasses.value = {};
      drafts.value = buildLevelDrafts(growing, character.value.level);
      preparedKey.value = key;

      // Каталог черт нужен только когда взятые уровни дают выбор черты —
      // боевой стиль, черту за повышение характеристик: иначе лишний запрос
      // на каждое повышение.
      const hasFeatChoice = steps.value.some((step) =>
        step.features.some((row) => row.featChoices.length > 0),
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
    loadedClasses.value = {};
    selectedSubclasses.value = {};
    preparedKey.value = null;
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
    const hitDie = steps.value[index]?.hitDie ?? 0;

    if (hitDie <= 0) {
      return;
    }

    const rolled = rollValue(getHitDieFormula(hitDie));

    updateDraft(index, {
      roll: {
        id: crypto.randomUUID(),
        label: getHitDieLabel(hitDie),
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
   * Выбор черты в умении. Смена черты обнуляет выбранные характеристики: у
   * новой черты свой список и своё число прибавок.
   *
   * @param index номер шага.
   * @param featureId идентификатор классового умения.
   * @param choiceId идентификатор выбора черты внутри умения.
   * @param featUrl url выбранной черты; '' — выбор снят.
   */
  function setFeatChoice(
    index: number,
    featureId: string,
    choiceId: string,
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
        [choiceId]: {
          featureId,
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
   * @param choiceId идентификатор выбора черты.
   * @param slot номер слота прибавки (с нуля).
   * @param ability выбранная характеристика; null — выбор снят.
   */
  function setFeatAbility(
    index: number,
    choiceId: string,
    slot: number,
    ability: AbilityKey | null,
  ): void {
    const draft = drafts.value[index];

    const choice = draft?.featChoices[choiceId];

    if (!draft || !choice) {
      return;
    }

    updateDraft(index, {
      featChoices: {
        ...draft.featChoices,
        [choiceId]: {
          ...choice,
          abilities: choice.abilities.map((current, currentSlot) =>
            currentSlot === slot ? ability : current,
          ),
        },
      },
    });
  }

  /**
   * Характеристики, от которых считается предел одного повышения: к итоговым
   * прибавляется всё, что уже разложено в мастере другими повышениями и
   * выбранными чертами. Без этого повышение сразу на несколько уровней подняло
   * бы одну характеристику выше предела.
   *
   * @param choiceId идентификатор выбора, для которого считается предел.
   * @returns характеристики с прибавками мастера.
   */
  function abilityScoresFor(choiceId: string): CharacterAbilities {
    return withPendingAbilityIncreases(abilityScores.value, [
      ...drafts.value.flatMap((draft) =>
        Object.entries(draft.abilityImprovements)
          .filter(
            ([id, improvement]) =>
              id !== choiceId && improvement.mode === 'abilities',
          )
          .map(([, improvement]) => improvement.increases),
      ),
      ...Object.entries(allFeatChoices.value)
        .filter(([id]) => id !== choiceId)
        .map(([, choice]) => collectFeatAbilityIncreases(choice.abilities)),
    ]);
  }

  /**
   * Ответ на повышение характеристик шага.
   *
   * @param index номер шага.
   * @param choiceId идентификатор выбора черты повышения.
   * @returns ответ игрока; по умолчанию — режим прибавок без прибавок.
   */
  function abilityImprovement(
    index: number,
    choiceId: string,
  ): LevelUpAbilityImprovement {
    return (
      drafts.value[index]?.abilityImprovements[choiceId]
      ?? DEFAULT_ABILITY_IMPROVEMENT
    );
  }

  /**
   * Смена режима повышения. Прежний ответ снимается целиком: прибавки и черта
   * — это два ответа на один и тот же выбор, и оставленный второй уехал бы на
   * лист вместе с первым.
   *
   * @param index номер шага.
   * @param choiceId идентификатор выбора черты повышения.
   * @param mode новый режим.
   */
  function setAbilityImprovementMode(
    index: number,
    choiceId: string,
    mode: AbilityImprovementMode,
  ): void {
    const draft = drafts.value[index];

    if (!draft) {
      return;
    }

    updateDraft(index, {
      featChoices: omit(draft.featChoices, [choiceId]),
      abilityImprovements: {
        ...draft.abilityImprovements,
        [choiceId]: { mode, increases: {} },
      },
    });
  }

  /**
   * Шаг ± у характеристики в режиме прибавок.
   *
   * @param index номер шага.
   * @param choiceId идентификатор выбора черты повышения.
   * @param ability ключ характеристики.
   * @param delta шаг изменения (+1 или −1).
   */
  function stepAbilityImprovement(
    index: number,
    choiceId: string,
    ability: AbilityKey,
    delta: number,
  ): void {
    const draft = drafts.value[index];

    if (!draft) {
      return;
    }

    const current = abilityImprovement(index, choiceId);

    updateDraft(index, {
      abilityImprovements: {
        ...draft.abilityImprovements,
        [choiceId]: {
          ...current,
          increases: withAbilityImprovementStep(
            abilityScoresFor(choiceId),
            current.increases,
            ability,
            delta,
          ),
        },
      },
    });
  }

  /**
   * Сброс разложенных прибавок повышения.
   *
   * @param index номер шага.
   * @param choiceId идентификатор выбора черты повышения.
   */
  function resetAbilityImprovement(index: number, choiceId: string): void {
    const draft = drafts.value[index];

    if (!draft) {
      return;
    }

    updateDraft(index, {
      abilityImprovements: {
        ...draft.abilityImprovements,
        [choiceId]: { ...abilityImprovement(index, choiceId), increases: {} },
      },
    });
  }

  /**
   * Подклассы класса шага, разрешённые источниками профиля.
   *
   * @param index номер шага.
   * @returns опции подклассов.
   */
  function subclassOptions(index: number): ClassOption[] {
    const classUrl = drafts.value[index]?.classUrl;

    return filterClassOptionsBySources(
      classUrl ? (loadedClasses.value[classUrl]?.subclassOptions ?? []) : [],
      selectedSourceIds.value,
    );
  }

  /**
   * Подкласс, выбранный в мастере для класса шага.
   *
   * @param index номер шага.
   * @returns URL подкласса; null — выбора не было.
   */
  function selectedSubclassUrl(index: number): string | null {
    const classUrl = drafts.value[index]?.classUrl;

    return classUrl ? (selectedSubclasses.value[classUrl] ?? null) : null;
  }

  /**
   * Выбор подкласса на его шаге: догружает деталь, после чего шаги пересобирают
   * умения подкласса. Выборы, чьи умения исчезли вместе с прежним подклассом,
   * снимаются.
   *
   * @param index номер шага.
   * @param subclassUrl URL выбранного подкласса.
   */
  async function selectSubclass(
    index: number,
    subclassUrl: string,
  ): Promise<void> {
    const classUrl = drafts.value[index]?.classUrl;

    const loaded = classUrl ? loadedClasses.value[classUrl] : undefined;

    if (
      !classUrl
      || !loaded
      || selectedSubclasses.value[classUrl] === subclassUrl
    ) {
      return;
    }

    isSubclassLoading.value = true;

    try {
      const detail = await fetchClassDetail(subclassUrl);

      if (!detail) {
        showLoadError();

        return;
      }

      loadedClasses.value = {
        ...loadedClasses.value,
        [classUrl]: { ...loaded, subclass: detail },
      };

      selectedSubclasses.value = {
        ...selectedSubclasses.value,
        [classUrl]: subclassUrl,
      };

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
      // Пул оружейного приёма — оружие во владении: приём даётся только
      // знакомому оружию.
      ownedWeaponNames: getOwnedWeaponNames(character.value),
      proficientSavingThrowNames: character.value.savingThrows
        .filter((savingThrow) => savingThrow.proficient)
        .map((savingThrow) => ABILITY_LABELS[savingThrow.key]),
      // Варианты, взятые на прошлых уровнях и на других ступенях этого мастера:
      // одно и то же воззвание по правилам дважды не берут
      takenOptionValues: getTakenOptionValues(
        choice,
        allChoices.value,
        allAnswers.value,
      ),
    });
  }

  /**
   * Пометки опций пикера: навыки, которыми персонаж уже владеет.
   *
   * @param choice распознанный выбор внутри умения.
   * @returns пометки по названиям опций выбора.
   */
  function choiceHints(choice: ClassChoice): Record<string, string> {
    return getChoiceSkillHints(choice, character.value.skills);
  }

  /**
   * Черты, доступные выбору черты в умении шага: из каталога уходят черты вне
   * категорий и списка выбора, уже взятые на листе и выбранные на других
   * шагах мастера.
   *
   * @param index номер шага.
   * @param choice выбор черты внутри умения.
   * @returns черты для селектора.
   */
  function featOptions(index: number, choice: ClassChoice): FeatSelectOption[] {
    const selectedUrl = drafts.value[index]?.featChoices[choice.id]?.featUrl;

    // Черты, занятые другими выборами этого же мастера, тоже недоступны:
    // повышение на несколько уровней даёт выбор не по одному разу.
    const chosenElsewhere = Object.entries(allFeatChoices.value)
      .filter(([id, entry]) => id !== choice.id && entry.featUrl)
      .map(([, entry]) => entry.featUrl);

    return getFeatChoiceOptions(
      featCatalog.value,
      choice,
      new Set([...takenFeatUrls.value, ...chosenElsewhere]),
      selectedUrl ?? '',
      selectedFeatSourceIds.value,
      // У выбора за повышение характеристик сама черта «Улучшение
      // характеристик» из пула уходит: её прибавки — это режим шага.
      isAbilityImprovementFeatChoice(choice),
    );
  }

  /**
   * Черта, выбранная в умении шага.
   *
   * @param index номер шага.
   * @param choiceId идентификатор выбора черты.
   * @returns опция черты; null — выбора не было либо черта не из каталога.
   */
  function selectedFeat(
    index: number,
    choiceId: string,
  ): FeatSelectOption | null {
    const featUrl = drafts.value[index]?.featChoices[choiceId]?.featUrl;

    if (!featUrl) {
      return null;
    }

    return featCatalog.value.find((feat) => feat.url === featUrl) ?? null;
  }

  /**
   * Готовность выборов черт на шаге: у каждого выбора черты в умениях уровня
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

    // Выборы повышения характеристик проверяет свой шаг: на шаге уровня их
    // карточек нет вовсе, и требовать там черту значило бы запереть уровень.
    const improvementChoiceIds = new Set(
      getAbilityImprovementChoices(step).map((choice) => choice.id),
    );

    return step.features
      .flatMap((row) => row.featChoices)
      .filter((featChoice) => !improvementChoiceIds.has(featChoice.id))
      .every((featChoice) => {
        const choice = draft.featChoices[featChoice.id];

        if (!choice?.featUrl) {
          return false;
        }

        return choice.abilities.every((ability) => ability !== null);
      });
  }

  /**
   * Готовность шага повышения характеристик: у каждого его выбора разложены
   * прибавки либо взята черта со всеми слотами. Неудачная загрузка каталога
   * требование к черте снимает — иначе шаг стал бы тупиком.
   *
   * @param index номер шага уровня.
   * @returns true — можно идти дальше.
   */
  function isAbilityImprovementStepValid(index: number): boolean {
    const step = steps.value[index];

    const draft = drafts.value[index];

    if (!step || !draft) {
      return false;
    }

    return getAbilityImprovementChoices(step).every((choice) => {
      const improvement = abilityImprovement(index, choice.id);

      if (improvement.mode === 'feat' && hasFeatsError.value) {
        return true;
      }

      return isAbilityImprovementComplete(
        improvement,
        draft.featChoices[choice.id],
        abilityScoresFor(choice.id),
      );
    });
  }

  /**
   * Готовность шага уровня: в режиме броска кость должна быть брошена, у
   * распознанных выборов должно быть нужное число значений (пустой список опций
   * требование снимает — иначе шаг стал бы тупиком), выборы черт заполнены, а на
   * шаге подкласса подкласс обязателен, если список подклассов загрузился
   * непустым.
   *
   * @param index номер шага уровня.
   * @returns true — можно идти дальше.
   */
  function isLevelStepValid(index: number): boolean {
    const step = steps.value[index];

    const draft = drafts.value[index];

    if (!step || !draft) {
      return false;
    }

    if (step.hitDie > 0 && draft.gainMode === 'roll' && !draft.roll) {
      return false;
    }

    const hasIncompleteChoice = step.features.some((row) =>
      row.choices.some((choice) => {
        const options = choiceOptions(choice);

        if (!options.length) {
          return false;
        }

        return (
          (draft.selections[choice.id] ?? []).length
          < getRequiredChoiceCount(choice, options)
        );
      }),
    );

    if (hasIncompleteChoice || !areFeatChoicesComplete(step, draft)) {
      return false;
    }

    return !(
      step.isSubclassStep
      && subclassOptions(index).length > 0
      && !selectedSubclassUrl(index)
    );
  }

  /**
   * Готовность шага в порядке показа: уровень и его повышение характеристик
   * проверяются каждый своим правилом.
   *
   * @param viewIndex номер шага среди показываемых.
   * @returns true — можно идти дальше.
   */
  function isStepValid(viewIndex: number): boolean {
    const view = wizardSteps.value[viewIndex];

    if (!view) {
      return false;
    }

    return view.key === 'abilities'
      ? isAbilityImprovementStepValid(view.draftIndex)
      : isLevelStepValid(view.draftIndex);
  }

  /**
   * Особенности черт, выбранных в умениях и выданных ими без выбора: описание
   * черты догружается из справочника (в каталоге `/select` его нет).
   * Идентификатор привязан к классовому умению, поэтому снятие уровня забирает
   * черту вместе с умением, а повторный выбор той же черты на другом уровне
   * не схлопывается.
   *
   * @returns особенности черт и подписи выбора по идентификаторам умений.
   */
  async function buildChosenFeatFeatures(): Promise<{
    features: CharacterFeature[];
    choiceLabels: Record<string, string>;
  }> {
    // Уровень берётся из шага, на котором сделан выбор: по нему снятие уровня
    // забирает черту вместе с давшим её умением.
    const entries = drafts.value.flatMap((draft, index) => [
      ...Object.values(draft.featChoices)
        .filter((choice) => choice.featUrl)
        .map((choice) => ({
          featureId: choice.featureId,
          featUrl: choice.featUrl,
          level: draft.classLevel,
          segment: CLASS_FEAT_CHOICE_ID_SEGMENT,
        })),
      // Черты без выбора умение выдаёт на своём уровне — как черту
      // происхождения предыстория
      ...(steps.value[index]?.features ?? []).flatMap((row) =>
        row.grantedFeatUrls.map((featUrl) => ({
          featureId: row.id,
          featUrl,
          level: draft.classLevel,
          segment: CLASS_GRANTED_FEAT_ID_SEGMENT,
        })),
      ),
    ]);

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
        id: `${entry.featureId}:${entry.segment}:${summary.url}`,
        level: entry.level,
      });

      // У умения бывает не один выбор черты: подпись собирается из всех
      const previous = choiceLabels[entry.featureId];

      choiceLabels[entry.featureId] = previous
        ? `${previous}, ${summary.name}`
        : summary.name;
    }

    return { features, choiceLabels };
  }

  /**
   * Записи листа о взятых повышениях характеристик: по записи на каждое
   * повышение, где игрок разложил прибавки. Режим черты сюда не идёт — черта
   * приезжает своим путём, вместе с остальными выборами умений.
   *
   * @returns особенности с эффектами повышения; пусто — повышений не было.
   */
  function buildAbilityImprovementFeatures(): CharacterFeature[] {
    return drafts.value.flatMap((draft, index) => {
      const step = steps.value[index];

      if (!step) {
        return [];
      }

      const className = loadedClasses.value[draft.classUrl]?.entry.name ?? '';

      return getAbilityImprovementRows(step).flatMap((row) =>
        row.featChoices.flatMap((choice) => {
          const improvement = draft.abilityImprovements[choice.id];

          if (
            improvement?.mode !== 'abilities'
            || getAbilityImprovementSpent(improvement.increases) === 0
          ) {
            return [];
          }

          return [
            buildAbilityImprovementFeature({
              featureRowId: row.id,
              className,
              classLevel: draft.classLevel,
              increases: improvement.increases,
            }),
          ];
        }),
      );
    });
  }

  /**
   * Сборка итога мастера. Умения берутся за взятые уровни каждого класса;
   * выбранный здесь подкласс приносит и свои умения более ранних уровней.
   * Выбранные черты догружаются из справочника, поэтому сборка асинхронна.
   *
   * @param experience суммарный опыт персонажа.
   * @returns итог для листа; null — детали классов не загружены либо черту
   *   загрузить не удалось.
   */
  async function buildPayload(
    experience: number,
  ): Promise<LevelUpPayload | null> {
    const loaded = Object.values(loadedClasses.value);

    if (!loaded.length) {
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

    // Из ответов берётся только текст выбора: владения ведёт снимок на самой
    // записи умения — так же, как у черты. Два хозяина у одного владения
    // означали бы, что снятие класса заберёт его лишь наполовину.
    const { featureChoices } = collectChoiceSelections(
      rows,
      allSelections.value,
    );

    // Ответы игрока, с которыми собирается снимок владений каждого умения:
    // вместе с ответами прошлых уровней — пересобранное умение заменяет запись
    // целиком, и без них выбранное раньше пропало бы
    const featureAnswers = {
      answers: allAnswers.value,
      proficientSkillNames: proficientSkillNames.value,
    };

    const choices = {
      ...allNotes.value,
      ...featureChoices,
      ...featChoiceLabels,
    };

    // Новые уровни классов: у каждого — максимальный взятый в мастере уровень.
    const classLevels: Record<string, number> = {};

    for (const draft of drafts.value) {
      classLevels[draft.classUrl] = Math.max(
        classLevels[draft.classUrl] ?? 0,
        draft.classLevel,
      );
    }

    const classPatches: Record<string, LevelUpClassPatch> = {};

    const classFeatures: CharacterFeature[] = [];
    const classResources: CharacterClassResource[] = [];

    for (const entry of loaded) {
      const { detail, subclass } = entry;

      const table = [...detail.table, ...(subclass?.table ?? [])];

      const level = classLevels[entry.entry.url] ?? entry.entry.level;

      const levelFeatures = drafts.value
        .filter((draft) => draft.classUrl === entry.entry.url)
        .flatMap((draft) =>
          buildLevelClassFeatures(
            detail,
            subclass,
            draft.classLevel,
            choices,
            featureAnswers,
          ),
        );

      const chosenSubclassUrl = selectedSubclasses.value[entry.entry.url];

      // Подкласс, выбранный прямо здесь, приносит и умения более ранних уровней.
      classFeatures.push(
        ...(chosenSubclassUrl && subclass
          ? mergeCharacterFeatures(
              levelFeatures,
              buildSubclassFeatures(
                entry.entry.url,
                subclass,
                level,
                choices,
                featureAnswers,
              ),
            )
          : levelFeatures),
      );

      classResources.push(
        ...deriveClassResources(entry.entry.url, table, level),
      );

      classPatches[entry.entry.url] = {
        subclass:
          chosenSubclassUrl && subclass
            ? {
                url: chosenSubclassUrl,
                name: subclass.name,
                casterType: getSelectedCasterType(detail, subclass),
              }
            : null,
        preparedSpells: derivePreparedSpellsScaling(table),
        preparedCantrips: deriveCantripsScaling(table),
      };
    }

    return {
      experience,
      classLevels,
      hitPointsGains: steps.value.map((step) => ({
        classUrl: step.classUrl,
        amount: step.hitPointsGain,
      })),
      classPatches,
      features: [
        ...classFeatures,
        ...featFeatures,
        ...buildAbilityImprovementFeatures(),
      ],
      classResources,
      // Навыки и языки, названные в умениях, приходят снимком самой записи
      // умения: здесь их нет вовсе
      skills: {
        proficient: [],
        expertise: [],
      },
      languages: [],
      abilityIncreases: mergeAbilityIncreases(
        Object.values(allFeatChoices.value).map((choice) =>
          collectFeatAbilityIncreases(choice.abilities),
        ),
      ),
    };
  }

  return {
    steps,
    wizardSteps,
    drafts: computed(() => drafts.value),
    abilityScoresFor,
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
    abilityImprovement,
    setAbilityImprovementMode,
    stepAbilityImprovement,
    resetAbilityImprovement,
    selectSubclass,
    choiceOptions,
    choiceHints,
    featOptions,
    selectedFeat,
    isStepValid,
    buildPayload,
  };
}
