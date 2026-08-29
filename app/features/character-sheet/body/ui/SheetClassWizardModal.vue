<script setup lang="ts">
  import type { TabsItem } from '@nuxt/ui';

  import type {
    AbilityKey,
    CharacterFeature,
    CharacterInventoryItem,
    ClassChoice,
    ClassOption,
    ClassSummary,
    ClassWizardTab,
    FeatSelectOption,
    LevelUpFeatChoice,
  } from '../../model';

  import { ClassDrawer } from '~classes/drawer';
  import { MarkupRender } from '~ui/markup';

  import {
    useCatalogSourceQuery,
    useCharacterSheet,
    useToolCatalog,
  } from '../../composables';
  import {
    ABILITY_IMPROVEMENT_LABELS,
    ABILITY_LABELS,
    buildClassFeatures,
    buildFeatFeature,
    buildStartingEquipmentItems,
    CLASS_FEAT_CHOICE_ID_SEGMENT,
    CLASS_FEAT_INVALID_RESPONSE_ERROR,
    CLASS_GRANTED_FEAT_ID_SEGMENT,
    CLASS_SOURCES_ASYNC_DATA_KEY,
    CLASS_WIZARD_LABELS,
    CLASS_WIZARD_TAB_LABELS,
    CLASS_WIZARD_TAB_ORDER,
    CLASSES_DETAIL_BASE_PATH,
    CLASSES_FILTERS_PATH,
    CLASSES_SEARCH_PATH,
    collectFeatAbilityIncreases,
    CUSTOM_CLASS_LABELS,
    deriveCantripsScaling,
    deriveClassResources,
    derivePreparedSpellsScaling,
    FEAT_SOURCES_ASYNC_DATA_KEY,
    FEATS_FILTERS_PATH,
    FEATS_SELECT_PATH,
    FEATURE_ORIGIN_LABELS,
    fetchFeatDetail,
    getCharacterClasses,
    getChoiceSkillHints,
    getClassFeatureChoices,
    getClassFeatureId,
    getClassMaxHitPoints,
    getClassSkillChoice,
    getClassToolChoice,
    getFeatChoiceOptions,
    getFeatChoicesUpToLevel,
    getFeatUrlFromFeatureId,
    getHitDieAverage,
    getLevelHitPointsGain,
    getMulticlassRequirementWarning,
    getOwnedWeaponNames,
    getRequiredChoiceCount,
    getSelectedCasterType,
    getToolNames,
    getUnmetMulticlassRequirements,
    LANGUAGE_PROFICIENCY_GROUPS,
    matchClassProficiencies,
    matchToolProficiencies,
    mergeAbilityIncreases,
    MULTICLASS_PROFICIENCY_LABELS,
    parseClassDetail,
    parseClassOptions,
    parseFeatSelectOptions,
    resolveChoiceOptions,
    SHEET_SEARCH_LABELS,
    SKILL_DUPLICATE_WARNING,
    STARTING_EQUIPMENT_SKIP_VALUE,
    SUBCLASS_SELECTION_MIN_LEVEL,
    unionToolProficiencies,
  } from '../../model';
  import SheetChoiceSelect from './SheetChoiceSelect.vue';
  import SheetCustomClassModal from './SheetCustomClassModal.vue';
  import SheetLevelUpFeatChoice from './SheetLevelUpFeatChoice.vue';
  import SheetSearchInput from './SheetSearchInput.vue';
  import SheetStartingEquipmentChoice from './SheetStartingEquipmentChoice.vue';

  type WizardStep = 'class' | 'review';

  /**
   * Загруженная черта умения класса — выбранная игроком (боевой стиль, черта за
   * повышение характеристик) либо выданная умением без выбора.
   */
  interface ClassFeatSelection {
    /** Идентификатор строки умения класса (`class:{featureKey}`). */
    rowId: string;

    /**
     * Название черты — идёт в подпись выбора у самого умения; у выданной без
     * выбора не нужно: выбора не было.
     */
    featName: string | null;

    /** Готовая запись особенности для листа. */
    feature: CharacterFeature;
  }

  const { mode = 'primary' } = defineProps<{
    /**
     * `primary` — выбор (или замена) основного класса, `add` — добавление
     * класса мультикласса первым уровнем.
     */
    mode?: 'primary' | 'add';
  }>();

  const emit = defineEmits<{
    close: [];
  }>();

  const toast = useToast();

  const overlay = useOverlay();

  const { character, setClass, addClass } = useCharacterSheet();

  const isAddMode = computed(() => mode === 'add');

  const modalTitle = computed(() =>
    isAddMode.value
      ? CLASS_WIZARD_LABELS.addTitle
      : CLASS_WIZARD_LABELS.primaryTitle,
  );

  /**
   * Подсказка режима добавления: порог подкласса считается по уровню В КЛАССЕ,
   * поэтому число подставляется в шаблон подписи.
   */
  const addModeHint = computed(
    () =>
      `${CLASS_WIZARD_LABELS.addHint} ${CLASS_WIZARD_LABELS.addSubclassHint.replace(
        '{level}',
        String(SUBCLASS_SELECTION_MIN_LEVEL),
      )}`,
  );

  /** Классы, уже взятые персонажем: повторно их не предлагаем. */
  const takenClassUrls = computed(
    () =>
      new Set(getCharacterClasses(character.value).map((entry) => entry.url)),
  );

  // Дровер описания класса/подкласса с сайта; без destroyOnClose — повторный
  // open() после закрытия иначе падает («Overlay not found»).
  const classPreviewDrawer = overlay.create(ClassDrawer, {
    props: {
      url: '',
      onClose: () => classPreviewDrawer.close(),
    },
  });

  // Свой класс собирается в отдельной модалке поверх списка: сама она и
  // применяет его к листу, поэтому мастер после успеха только закрывается, а
  // отмена возвращает к списку каталога.
  const customClassModal = overlay.create(SheetCustomClassModal);

  function handlePreview(url: string) {
    classPreviewDrawer.open({ url });
  }

  async function handleCustomClass() {
    const isCreated = await customClassModal.open();

    if (isCreated) {
      emit('close');
    }
  }

  const step = ref<WizardStep>('class');

  // Уровень, на который собирается класс: основной берёт свой прежний уровень
  // (у листа без класса — весь уровень персонажа), добавляемый начинается с
  // первого — дальше его поднимает мастер повышения.
  const level = computed(() =>
    isAddMode.value
      ? 1
      : (character.value.characterClass?.level ?? character.value.level),
  );

  // Источники берутся из глобальной настройки профиля — визард не показывает
  // классы из отключённых книг. Запрос ждём до списка: иначе первая выдача
  // пришла бы по всем источникам и мигнула лишними строками. Черты боевого
  // стиля отбираются теми же источниками, но их эндпоинт `/feats/select` по
  // источникам не фильтрует, поэтому отбор идёт на клиенте — в селекторе.
  // Оба набора фильтров грузятся параллельно: открытие визарда ждёт их обоих.
  const [{ sourceQuery }, { selectedSourceIds: featSourceIds }] =
    await Promise.all([
      useCatalogSourceQuery(CLASS_SOURCES_ASYNC_DATA_KEY, CLASSES_FILTERS_PATH),
      useCatalogSourceQuery(FEAT_SOURCES_ASYNC_DATA_KEY, FEATS_FILTERS_PATH),
    ]);

  // Полный список классов загружается сразу при открытии визарда.
  const { data: classList, status: listStatus } = await useAsyncData(
    'character-sheet:class-list',
    async () => {
      const response = await $fetch<unknown>(CLASSES_SEARCH_PATH, {
        method: 'GET',
        query: { ...sourceQuery.value },
        retry: 0,
      });

      return parseClassOptions(response);
    },
    { server: false },
  );

  const isListLoading = computed(() => listStatus.value === 'pending');

  const searchTerm = ref('');

  const selectedClass = ref<ClassOption | undefined>();

  const selectedSubclass = ref<ClassOption | null>(null);

  const expandedUrls = ref(new Set<string>());

  const subclassesByUrl = ref<Record<string, ClassOption[]>>({});

  const loadingSubclassesUrl = ref<string | null>(null);

  const classDetail = ref<ClassSummary | null>(null);

  const subclassDetail = ref<ClassSummary | null>(null);

  const isStepLoading = ref(false);

  const choices = ref<Record<string, string>>({});

  /** Черновик выборов-селекторов по id выбора: id → выбранные значения. */
  const selections = ref<Record<string, string[]>>({});

  /** Выборы черт по идентификатору выбора умения. */
  const featSelections = ref<Record<string, LevelUpFeatChoice>>({});

  /** Каталог черт для выборов черты в умениях; грузится, когда они есть. */
  const featCatalog = ref<FeatSelectOption[]>([]);

  const isFeatsLoading = ref(false);

  const hasFeatsError = ref(false);

  /** Черты, уже взятые на листе: повторно не предлагаются. */
  const takenFeatUrls = computed(
    () =>
      new Set(
        character.value.features.flatMap((feature) => {
          const url = getFeatUrlFromFeatureId(feature.id);

          return url ? [url] : [];
        }),
      ),
  );

  /** Метка выбранного варианта стартового снаряжения (или «не добавлять»). */
  const startingEquipmentLabel = ref(STARTING_EQUIPMENT_SKIP_VALUE);

  const isApplying = shallowRef(false);

  const subclassAvailable = computed(
    () => level.value >= SUBCLASS_SELECTION_MIN_LEVEL,
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

  // Каталог инструментов грузится фоном: он нужен только на шаге владений, а
  // список классов не должен ждать ещё один запрос.
  const {
    catalogItems: toolCatalogItems,
    getToolNamesForGroups,
    resolveTools,
    load: loadToolCatalog,
  } = useToolCatalog();

  void loadToolCatalog();

  const filteredOptions = computed(() => {
    const query = searchTerm.value.trim().toLowerCase();

    // Класс, уровни в котором уже есть, добавляют не вторым слотом, а
    // повышением уровня — из списка добавления он уходит.
    const list = (classList.value ?? []).filter(
      (option) => !isAddMode.value || !takenClassUrls.value.has(option.url),
    );

    if (!query) {
      return list;
    }

    return list.filter((option) => option.name.toLowerCase().includes(query));
  });

  const displayRows = computed(() =>
    filteredOptions.value.map((option) => {
      const isExpanded = expandedUrls.value.has(option.url);

      const isSelected = selectedClass.value?.url === option.url;

      return {
        ...option,
        isExpanded,
        isSelected,
        isSubclassesLoading: loadingSubclassesUrl.value === option.url,
        rowClass: isSelected ? 'bg-elevated' : '',
        chevronClass: isExpanded ? 'rotate-90' : '',
        subclasses: (subclassesByUrl.value[option.url] ?? []).map(
          (subclass) => {
            const isSubclassSelected =
              selectedClass.value?.url === option.url
              && selectedSubclass.value?.url === subclass.url;

            return {
              url: subclass.url,
              name: subclass.name,
              // Источник обязателен в строке: одноимённые подклассы приходят из
              // разных книг (например, «Наследник троих» из FRHoF и UAFRS), и
              // без него они выглядят дубликатом.
              sourceLabel: subclass.sourceLabel,
              isSelectable: subclassAvailable.value,
              isSelected: isSubclassSelected,
              rowClass: isSubclassSelected ? 'bg-elevated' : '',
            };
          },
        ),
      };
    }),
  );

  const resultName = computed(() => {
    if (!classDetail.value) {
      return '';
    }

    return subclassDetail.value
      ? `${classDetail.value.name} (${subclassDetail.value.name})`
      : classDetail.value.name;
  });

  const hitDieLabel = computed(() =>
    classDetail.value ? `1${classDetail.value.hitDieLabel}` : '',
  );

  // Хиты, которые получит лист при применении: первый уровень — максимум кости,
  // следующие — среднее; модификатор Телосложения входит в каждый уровень.
  const maxHitPointsPreview = computed(() => {
    if (!classDetail.value) {
      return 0;
    }

    const modifier = getModifier(character.value.abilities.constitution);

    // Второй класс максимума кости на своём первом уровне не даёт (правило
    // 2024) — только среднее, и прибавляется оно к уже набранным хитам.
    if (isAddMode.value) {
      return (
        character.value.health.max
        + getLevelHitPointsGain(
          getHitDieAverage(classDetail.value.hitDie),
          modifier,
        )
      );
    }

    return getClassMaxHitPoints(
      classDetail.value.hitDie,
      level.value,
      modifier,
    );
  });

  const savingThrowLabels = computed(() =>
    (classDetail.value?.savingThrows ?? []).map((key) => ABILITY_LABELS[key]),
  );

  const matchedProficiencies = computed(() =>
    classDetail.value
      ? matchClassProficiencies(classDetail.value.proficiencyText)
      : { armor: [], weapons: [] },
  );

  // Фиксированные инструменты класса сверяются с каталогом сайта: найденное
  // получает ссылку, ненайденное остаётся своим инструментом игрока.
  const matchedTools = computed(() =>
    classDetail.value
      ? matchToolProficiencies(
          classDetail.value.proficiencyText.tool,
          toolCatalogItems.value,
        )
      : [],
  );

  const proficiencyChips = computed(() => [
    ...matchedProficiencies.value.armor,
    ...matchedProficiencies.value.weapons,
    ...getToolNames(matchedTools.value),
  ]);

  const derivedResources = computed(() => {
    if (!classDetail.value) {
      return [];
    }

    return deriveClassResources(
      classDetail.value.url,
      [...classDetail.value.table, ...(subclassDetail.value?.table ?? [])],
      level.value,
    );
  });

  // Стартовое снаряжение даёт только базовый класс: у подкласса своего набора
  // нет.
  // Стартовое снаряжение выдаёт только первый класс персонажа (правило 2024),
  // поэтому у добавляемого выбора набора нет.
  const startingEquipmentOptions = computed(() =>
    isAddMode.value ? [] : (classDetail.value?.startingEquipment ?? []),
  );

  const selectedStartingEquipmentOption = computed(() =>
    startingEquipmentOptions.value.find(
      (option) => option.label === startingEquipmentLabel.value,
    ),
  );

  // Выборы уровня класса (владение навыками/инструментами) из прозы владений.
  const classChoices = computed<ClassChoice[]>(() => {
    const base = classDetail.value;

    // Владения второго класса лист не выдаёт (урезанного набора справочник не
    // отдаёт), поэтому и выбирать их в мастере добавления нечего.
    if (!base || isAddMode.value) {
      return [];
    }

    return [
      getClassSkillChoice(base.proficiencyText.skill, skillNames.value),
      getClassToolChoice(base.proficiencyText.tool),
    ].filter((choice): choice is ClassChoice => choice !== null);
  });

  /** Опции пикера выбора в зависимости от его типа. */
  function choiceOptions(choice: ClassChoice): string[] {
    return resolveChoiceOptions(choice, {
      skillNames: skillNames.value,
      proficientSkillNames: proficientSkillNames.value,
      chosenProficientSkills: selections.value['class-skills'] ?? [],
      knownLanguages: character.value.proficiencies.languages,
      knownTools: getToolNames(character.value.proficiencies.tools),
      allLanguages: allLanguages.value,
      // Опции выбора инструмента — из каталога сайта, сузженные до групп,
      // названных в прозе («один вид ремесленных инструментов»).
      allTools: getToolNamesForGroups(choice.toolGroups),
      // Пул оружейного приёма — оружие во владении: приём даётся только
      // знакомому оружию.
      ownedWeaponNames: getOwnedWeaponNames(character.value),
      proficientSavingThrowNames: character.value.savingThrows
        .filter((savingThrow) => savingThrow.proficient)
        .map((savingThrow) => ABILITY_LABELS[savingThrow.key]),
    });
  }

  /** Пометки опций: навыки, которыми персонаж уже владеет. */
  function choiceHints(choice: ClassChoice): Record<string, string> {
    return getChoiceSkillHints(choice, character.value.skills);
  }

  /** Требуемое число опций: не больше, чем доступно в списке выбора. */
  function choiceCount(choice: ClassChoice): number {
    return getRequiredChoiceCount(choice, choiceOptions(choice));
  }

  /** Обновление выбора с ограничением по требуемому количеству. */
  function updateSelection(choice: ClassChoice, values: string[]): void {
    selections.value = {
      ...selections.value,
      [choice.id]: values.slice(0, choiceCount(choice)),
    };
  }

  const featureRows = computed(() => {
    const base = classDetail.value;

    if (!base) {
      return [];
    }

    const rows: Array<{
      id: string;
      name: string;
      level: number;
      description: ClassSummary['features'][number]['description'];
      originLabel: string;
      choiceControls: ClassChoice[];
      featChoices: ClassChoice[];
      grantedFeatUrls: string[];
    }> = [];

    const seenKeys = new Set<string>();

    const push = (
      summary: ClassSummary,
      originLabel: string,
      onlySubclass: boolean,
    ) => {
      for (const feature of summary.features) {
        if (
          feature.isSubclass !== onlySubclass
          || feature.level > level.value
          || seenKeys.has(feature.key)
        ) {
          continue;
        }

        seenKeys.add(feature.key);

        const id = getClassFeatureId(base.url, feature.key);

        rows.push({
          id,
          name: feature.name,
          level: feature.level,
          description: feature.description,
          originLabel,
          choiceControls: getClassFeatureChoices(
            id,
            feature,
            skillNames.value,
            level.value,
          ),
          // Персонаж собирается сразу на нужном уровне: «Улучшение
          // характеристик» спрашивает черту за каждый пройденный уровень роста
          featChoices: getFeatChoicesUpToLevel(feature, level.value),
          grantedFeatUrls: [...feature.grantedFeatUrls],
        });
      }
    };

    push(base, `${FEATURE_ORIGIN_LABELS.class}: ${base.name}`, false);

    if (subclassDetail.value) {
      push(
        subclassDetail.value,
        `Подкласс: ${subclassDetail.value.name}`,
        true,
      );
    }

    return rows;
  });

  /**
   * Требование мультиклассирования: 13 в ключевых характеристиках класса
   * (D&D 2024). Предупреждение не блокирует — лист инструмент, а не судья.
   */
  const requirementWarning = computed(() => {
    if (!isAddMode.value || !classDetail.value) {
      return '';
    }

    return getMulticlassRequirementWarning(
      getUnmetMulticlassRequirements(
        character.value,
        classDetail.value.primaryCharacteristics,
      ),
    );
  });

  /**
   * Полный набор владений класса — справкой. Урезанный набор мультикласса
   * справочник не отдаёт (`multiclassProficiency` пустой у всех классов),
   * поэтому лист их не выдаёт: игрок отмечает нужное на панели владений.
   */
  const multiclassProficiencyRows = computed(() => {
    const proficiency = classDetail.value?.proficiencyText;

    if (!isAddMode.value || !proficiency) {
      return [];
    }

    return [
      {
        key: 'armor',
        label: MULTICLASS_PROFICIENCY_LABELS.armor,
        value: proficiency.armor,
      },
      {
        key: 'weapon',
        label: MULTICLASS_PROFICIENCY_LABELS.weapon,
        value: proficiency.weapon,
      },
      {
        key: 'tool',
        label: MULTICLASS_PROFICIENCY_LABELS.tool,
        value: proficiency.tool,
      },
      {
        key: 'skill',
        label: MULTICLASS_PROFICIENCY_LABELS.skill,
        value: proficiency.skill,
      },
    ].map((row) => ({
      ...row,
      value: row.value.trim() || MULTICLASS_PROFICIENCY_LABELS.empty,
    }));
  });

  const isNextDisabled = computed(() => !selectedClass.value);

  /**
   * Все выборы черт отвечены, а у черт с прибавками заполнены характеристики.
   * Сбой каталога требование снимает — иначе класс нельзя было бы применить.
   */
  const areFeatChoicesComplete = computed(
    () =>
      hasFeatsError.value
      || featureRows.value
        .flatMap((row) => row.featChoices)
        .every((choice) => {
          const selection = featSelections.value[choice.id];

          return (
            !!selection?.featUrl
            && selection.abilities.every((ability) => ability !== null)
          );
        }),
  );

  const isApplyDisabled = computed(
    () => isApplying.value || !areFeatChoicesComplete.value,
  );

  // ── Разделы второго шага ─────────────────────────────────────

  /**
   * Оформление блока внутри раздела. Хиты, владения и выборы шли подряд без
   * рамок и сливались в одну простыню, хотя это три разных разговора; рамка та
   * же, что у карточек умений ниже, — по ней раздел и читается блоками.
   */
  const REVIEW_SECTION_CLASS =
    'flex flex-col gap-2 rounded-lg border border-default/50 bg-elevated/20 p-3';

  const reviewTab = ref<ClassWizardTab>('overview');

  /**
   * Незакрытые выборы списка: по ним считается счётчик на вкладке.
   *
   * @param choices выборы раздела.
   * @returns выборы, на которые ответов ещё не хватает.
   */
  function getPendingChoices(choices: ClassChoice[]): ClassChoice[] {
    return choices.filter(
      (choice) =>
        (selections.value[choice.id]?.length ?? 0) < choiceCount(choice),
    );
  }

  /**
   * Незакрытые выборы черт: черта не названа либо у неё не заполнены прибавки.
   * Сбой каталога счётчик обнуляет — там выбирать не из чего, и торопить не с
   * чем (по той же причине снимается запрет применения).
   */
  const pendingFeatChoiceCount = computed(() => {
    if (hasFeatsError.value) {
      return 0;
    }

    const pending = featureRows.value
      .flatMap((row) => row.featChoices)
      .filter((choice) => {
        const selection = featSelections.value[choice.id];

        return !selection?.featUrl || selection.abilities.includes(null);
      });

    return pending.length;
  });

  /**
   * Сколько ответов раздел ещё ждёт: их число висит на вкладке.
   *
   * Снаряжение не считается: вариант предвыбран, и «Не добавлять» тоже ответ.
   */
  const pendingByTab = computed<Record<ClassWizardTab, number>>(() => ({
    overview: getPendingChoices(classChoices.value).length,
    equipment: 0,
    features:
      pendingFeatChoiceCount.value
      + getPendingChoices(
        featureRows.value.flatMap((row) => row.choiceControls),
      ).length,
  }));

  /** Разделы, которым есть что показать: пустая вкладка только сбивает. */
  const shownReviewTabs = computed<ClassWizardTab[]>(() =>
    CLASS_WIZARD_TAB_ORDER.filter((tab) => {
      if (tab === 'equipment') {
        return startingEquipmentOptions.value.length > 0;
      }

      if (tab === 'features') {
        return featureRows.value.length > 0;
      }

      return true;
    }),
  );

  const reviewTabItems = computed<TabsItem[]>(() =>
    shownReviewTabs.value.map((tab) => ({
      value: tab,
      label: CLASS_WIZARD_TAB_LABELS[tab],
      // Число нерешённого — подсказка, куда идти: раздел с ним и заблокировал
      // применение, а открыт может быть совсем другой
      badge: pendingByTab.value[tab]
        ? {
            label: String(pendingByTab.value[tab]),
            // На залитой акцентом открытой вкладке `warning` сливается с ней в
            // тёмной теме — там счётчик нейтральный (см. мастер предыстории)
            color: tab === reviewTab.value ? 'neutral' : 'warning',
            variant: 'subtle',
          }
        : undefined,
    })),
  );

  /**
   * Переключение раздела. `UTabs` отдаёт значение строкой, поэтому раздел
   * ищется среди своих же — так в состояние не попадёт чужое значение.
   *
   * @param value значение вкладки.
   */
  function handleReviewTabChange(value: string | number) {
    const tab = shownReviewTabs.value.find((shown) => shown === value);

    if (tab) {
      reviewTab.value = tab;
    }
  }

  function showLoadError() {
    toast.add({
      color: 'error',
      icon: 'tabler:alert-triangle',
      title: 'Не удалось загрузить данные класса',
    });
  }

  function showFeatError() {
    toast.add({
      color: 'error',
      icon: 'tabler:alert-triangle',
      title: ABILITY_IMPROVEMENT_LABELS.applyError,
    });
  }

  /**
   * Каталог черт для выборов в умениях. Список берётся целиком с `/select`:
   * только он отдаёт повторяемость и прибавки к характеристикам, а категории
   * и уже взятые черты отбираются на клиенте — как в мастере повышения.
   */
  async function loadFeats(): Promise<void> {
    isFeatsLoading.value = true;
    hasFeatsError.value = false;

    try {
      const response = await $fetch<unknown>(FEATS_SELECT_PATH, {
        method: 'GET',
        retry: 0,
      });

      featCatalog.value = parseFeatSelectOptions(response);
    } catch (error) {
      consola.error(ABILITY_IMPROVEMENT_LABELS.applyErrorLog, error);
      hasFeatsError.value = true;
    } finally {
      isFeatsLoading.value = false;
    }
  }

  /**
   * Черты, доступные выбору черты в умении: пул сужен категориями и перечнем
   * выбора, уже взятыми чертами и выбранными в других умениях мастера.
   *
   * @param choice выбор черты умения.
   * @returns черты для селектора.
   */
  function featOptions(choice: ClassChoice): FeatSelectOption[] {
    const selectedUrl = featSelections.value[choice.id]?.featUrl ?? '';

    const chosenElsewhere = Object.entries(featSelections.value)
      .filter(([id, entry]) => id !== choice.id && entry.featUrl)
      .map(([, entry]) => entry.featUrl);

    return getFeatChoiceOptions(
      featCatalog.value,
      choice,
      new Set([...takenFeatUrls.value, ...chosenElsewhere]),
      selectedUrl,
      featSourceIds.value,
    );
  }

  /**
   * Черта, выбранная в выборе умения.
   *
   * @param choiceId идентификатор выбора черты.
   * @returns опция черты; null — выбора не было либо черта не из каталога.
   */
  function selectedFeat(choiceId: string): FeatSelectOption | null {
    const featUrl = featSelections.value[choiceId]?.featUrl;

    return featUrl
      ? (featCatalog.value.find((feat) => feat.url === featUrl) ?? null)
      : null;
  }

  /**
   * Выбранные характеристики по слотам прибавок черты; пусто — черта не
   * выбрана либо прибавок не даёт.
   *
   * @param choiceId идентификатор выбора черты.
   * @returns характеристики по слотам.
   */
  function featAbilities(choiceId: string): Array<AbilityKey | null> {
    return featSelections.value[choiceId]?.abilities ?? [];
  }

  /**
   * Выбор черты в умении. Смена черты обнуляет выбранные характеристики: у
   * новой черты свой список и своё число прибавок.
   *
   * @param rowId идентификатор строки умения.
   * @param choiceId идентификатор выбора черты.
   * @param featUrl url выбранной черты; '' — выбор снят.
   */
  function setFeatChoice(rowId: string, choiceId: string, featUrl: string) {
    const option = featCatalog.value.find((feat) => feat.url === featUrl);

    featSelections.value = {
      ...featSelections.value,
      [choiceId]: {
        featureId: rowId,
        featUrl,
        abilities: Array.from<AbilityKey | null>({
          length: option?.abilityIncreaseCount ?? 0,
        }).fill(null),
      },
    };
  }

  /**
   * Выбор характеристики в слоте прибавки выбранной черты.
   *
   * @param choiceId идентификатор выбора черты.
   * @param payload номер слота и выбранная характеристика.
   * @param payload.slot номер слота прибавки (с нуля).
   * @param payload.ability выбранная характеристика; null — выбор снят.
   */
  function setFeatAbility(
    choiceId: string,
    payload: { slot: number; ability: AbilityKey | null },
  ) {
    const selection = featSelections.value[choiceId];

    if (!selection) {
      return;
    }

    featSelections.value = {
      ...featSelections.value,
      [choiceId]: {
        ...selection,
        abilities: selection.abilities.map((current, slot) =>
          slot === payload.slot ? payload.ability : current,
        ),
      },
    };
  }

  function findClassOption(classUrl: string): ClassOption | undefined {
    return (classList.value ?? []).find((option) => option.url === classUrl);
  }

  async function fetchClassDetail(url: string): Promise<ClassSummary | null> {
    const response = await $fetch<unknown>(
      `${CLASSES_DETAIL_BASE_PATH}/${url}`,
      {
        method: 'GET',
        retry: 0,
      },
    );

    return parseClassDetail(response);
  }

  async function fetchSubclasses(url: string): Promise<ClassOption[]> {
    const response = await $fetch<unknown>(
      `${CLASSES_DETAIL_BASE_PATH}/${url}/subclasses`,
      { method: 'GET', retry: 0 },
    );

    return parseClassOptions(response, true);
  }

  async function toggleSubclasses(option: ClassOption) {
    if (expandedUrls.value.has(option.url)) {
      expandedUrls.value.delete(option.url);

      return;
    }

    if (!subclassesByUrl.value[option.url]) {
      loadingSubclassesUrl.value = option.url;

      try {
        subclassesByUrl.value[option.url] = await fetchSubclasses(option.url);
      } catch (error) {
        consola.error('Ошибка загрузки подклассов:', error);
        showLoadError();

        return;
      } finally {
        loadingSubclassesUrl.value = null;
      }
    }

    expandedUrls.value.add(option.url);
  }

  function handleClassSelect(classUrl: string) {
    const option = findClassOption(classUrl);

    if (!option) {
      return;
    }

    // Клик по названию выбирает базовый класс и сбрасывает подкласс.
    selectedClass.value = option;
    selectedSubclass.value = null;
  }

  function handleChevronClick(classUrl: string) {
    const option = findClassOption(classUrl);

    if (option) {
      void toggleSubclasses(option);
    }
  }

  function handleSubclassClick(classUrl: string, subclassUrl: string) {
    // Подкласс доступен только с порогового уровня.
    if (!subclassAvailable.value) {
      return;
    }

    const option = findClassOption(classUrl);

    const subclass = subclassesByUrl.value[classUrl]?.find(
      (subclassOption) => subclassOption.url === subclassUrl,
    );

    if (!option || !subclass) {
      return;
    }

    selectedClass.value = option;
    selectedSubclass.value = subclass;
  }

  async function handleNext() {
    const option = selectedClass.value;

    if (!option || isStepLoading.value || isNextDisabled.value) {
      return;
    }

    isStepLoading.value = true;

    try {
      classDetail.value = await fetchClassDetail(option.url);

      if (!classDetail.value) {
        showLoadError();

        return;
      }

      subclassDetail.value = selectedSubclass.value
        ? await fetchClassDetail(selectedSubclass.value.url)
        : null;

      if (selectedSubclass.value && !subclassDetail.value) {
        showLoadError();

        return;
      }

      choices.value = {};
      selections.value = {};
      featSelections.value = {};

      // Каталог черт нужен только классу с выбором черты до этого уровня:
      // иначе лишний запрос на каждое открытие мастера
      if (
        featureRows.value.some((row) => row.featChoices.length > 0)
        && !featCatalog.value.length
      ) {
        await loadFeats();
      }

      // Первый вариант снаряжения предлагается по умолчанию: лист чаще всего
      // заполняется на создании персонажа, где набор класса нужен целиком.
      startingEquipmentLabel.value =
        classDetail.value.startingEquipment[0]?.label
        ?? STARTING_EQUIPMENT_SKIP_VALUE;

      reviewTab.value = shownReviewTabs.value[0] ?? 'overview';
      step.value = 'review';
    } catch (error) {
      consola.error('Ошибка загрузки класса:', error);
      showLoadError();
    } finally {
      isStepLoading.value = false;
    }
  }

  function handleBack() {
    step.value = 'class';
  }

  /**
   * Загружает черты умений — выбранные игроком и выданные без выбора — и
   * делает их классовыми записями, чтобы смена класса удаляла их вместе с
   * умением. Выборы без ответа сюда не попадают: применение до полного выбора
   * блокирует `isApplyDisabled`.
   */
  function buildClassFeatFeatures(): Promise<Array<ClassFeatSelection>> {
    const entries: Array<{
      rowId: string;
      featUrl: string;
      segment: string;
      chosen: boolean;
    }> = [];

    for (const selection of Object.values(featSelections.value)) {
      if (selection.featUrl) {
        entries.push({
          rowId: selection.featureId,
          featUrl: selection.featUrl,
          segment: CLASS_FEAT_CHOICE_ID_SEGMENT,
          chosen: true,
        });
      }
    }

    for (const row of featureRows.value) {
      for (const featUrl of row.grantedFeatUrls) {
        entries.push({
          rowId: row.id,
          featUrl,
          segment: CLASS_GRANTED_FEAT_ID_SEGMENT,
          chosen: false,
        });
      }
    }

    return Promise.all(
      entries.map(async (entry) => {
        const summary = await fetchFeatDetail(entry.featUrl);

        if (!summary) {
          throw new Error(CLASS_FEAT_INVALID_RESPONSE_ERROR);
        }

        return {
          rowId: entry.rowId,
          featName: entry.chosen ? summary.name : null,
          feature: {
            ...buildFeatFeature(summary),
            id: `${entry.rowId}:${entry.segment}:${summary.url}`,
          },
        };
      }),
    );
  }

  /**
   * Загрузка выборов мастера и применение класса к листу.
   *
   * @param base деталь выбранного класса.
   */
  async function applyClass(base: ClassSummary) {
    // Под `try` только загрузка черт: ошибка сети не должна выглядеть как сбой
    // применения класса, а применение ниже — синхронное и не бросает.
    let classFeatFeatures: Array<ClassFeatSelection>;

    try {
      classFeatFeatures = await buildClassFeatFeatures();
    } catch (error) {
      consola.error(ABILITY_IMPROVEMENT_LABELS.applyErrorLog, error);

      showFeatError();

      return;
    }

    // Прибавки черт с повышением характеристик считаются здесь же — как в
    // мастере повышения уровня
    const abilityIncreases = mergeAbilityIncreases(
      Object.values(featSelections.value).map((selection) =>
        collectFeatAbilityIncreases(selection.abilities),
      ),
    );

    // Предметы выбранного варианта снаряжения догружаются до применения; их
    // неудачные запросы гасятся внутри, поэтому шаг не бросает.
    const startingEquipmentOption = selectedStartingEquipmentOption.value;

    const startingEquipmentItems: CharacterInventoryItem[] =
      startingEquipmentOption
        ? await buildStartingEquipmentItems(startingEquipmentOption)
        : [];

    const matched = matchClassProficiencies(base.proficiencyText);

    // Выбор владения навыками (уровень класса).
    const skillsChoice = classChoices.value.find(
      (choice) => choice.id === 'class-skills',
    );

    const proficientSkills: string[] = skillsChoice
      ? (selections.value['class-skills'] ?? []).slice(
          0,
          choiceCount(skillsChoice),
        )
      : [];

    const chosenTools = selections.value['class-tools'] ?? [];

    const featureChoices: Record<string, string> = { ...choices.value };

    // У умения бывает не один выбор черты: подпись собирается из всех
    for (const selection of classFeatFeatures) {
      if (!selection.featName) {
        continue;
      }

      const previous = featureChoices[selection.rowId];

      featureChoices[selection.rowId] = previous
        ? `${previous}, ${selection.featName}`
        : selection.featName;
    }

    // Ответы на выборы умений идут в текст умения — чтобы выбранное было видно
    // на листе. Владения из этих ответов лист забирает не отсюда: их снимок
    // ложится на саму запись умения, и журнал выдач ведёт её так же, как черту.
    // Иначе одно и то же владение имело бы два хозяина, и снятие класса забрало
    // бы его лишь наполовину.
    const featureControls = featureRows.value.flatMap(
      (row) => row.choiceControls,
    );

    for (const control of featureControls) {
      const values = selections.value[control.id] ?? [];

      if (values.length) {
        featureChoices[control.id] = values.join(', ');
      }
    }

    // Ответы игрока, с которыми собирается снимок владений каждого умения
    const featureAnswers = {
      answers: selections.value,
      proficientSkillNames: proficientSkillNames.value,
    };

    const characterClass = {
      url: base.url,
      name: base.name,
      level: level.value,
      subclassUrl: selectedSubclass.value?.url ?? null,
      subclassName: subclassDetail.value?.name ?? null,
      casterType: getSelectedCasterType(base, subclassDetail.value),
      hitDie: base.hitDie,
      // Характеристика определяется по названию класса, пока игрок не задал
      // свою на вкладке заклинаний.
      spellcastingAbility: null,
      // Колонка подготовленных заклинаний бывает и у класса, и только у
      // подкласса (мистический рыцарь), поэтому таблицы просматриваются
      // вместе. Колонка заговоров живёт в той же таблице.
      preparedSpells: derivePreparedSpellsScaling([
        ...base.table,
        ...(subclassDetail.value?.table ?? []),
      ]),
      preparedCantrips: deriveCantripsScaling([
        ...base.table,
        ...(subclassDetail.value?.table ?? []),
      ]),
    };

    const features = [
      ...buildClassFeatures(
        base,
        subclassDetail.value,
        level.value,
        featureChoices,
        featureAnswers,
      ),
      ...classFeatFeatures.map((selection) => selection.feature),
    ];

    // Навыки уровня класса: выборы умений сюда не идут — их владения ведёт
    // снимок на самой записи умения
    const skills = {
      proficient: [...new Set(proficientSkills)],
      expertise: [],
    };

    // Урезанный набор владений мультикласса справочник не отдаёт, поэтому
    // добавленный класс не выдаёт ни брони с оружием, ни навыков прозы —
    // только то, что игрок выбрал сам в умениях уровня.
    if (isAddMode.value) {
      addClass({
        characterClass,
        hitDie: base.hitDie,
        skills,
        // Языки, названные в умениях, приходят снимком самой записи умения
        languages: [],
        classResources: derivedResources.value,
        features,
        abilityIncreases,
      });

      emit('close');

      return;
    }

    setClass({
      characterClass,
      savingThrows: base.savingThrows,
      hitDie: base.hitDie,
      proficiencies: {
        armor: matched.armor,
        weapons: matched.weapons,
        // Фиксированные инструменты уже сверены с каталогом, выбранные игроком
        // приходят названиями — их сверяет `resolveTools`.
        tools: unionToolProficiencies(
          matchedTools.value,
          resolveTools(chosenTools.map((name) => ({ name, url: null }))),
        ),
        // Языки, названные в умениях, приходят снимком самой записи умения
        languages: [],
      },
      skills,
      classResources: derivedResources.value,
      features,
      abilityIncreases,
      // Снаряжение применяется вместе с классом: лист сам снимет набор прошлого
      // выбора, поэтому повторный выбор класса не копит предметы и монеты.
      startingEquipment: startingEquipmentOption
        ? {
            items: startingEquipmentItems,
            coins: startingEquipmentOption.coins,
            coinKey: startingEquipmentOption.coinKey,
          }
        : null,
    });

    emit('close');
  }

  /** Применяет выбранный класс и все связанные с ним выборы к листу. */
  async function handleApply() {
    const base = classDetail.value;

    if (!base || isApplyDisabled.value) {
      return;
    }

    isApplying.value = true;

    try {
      await applyClass(base);
    } finally {
      isApplying.value = false;
    }
  }

  function handleCancel() {
    emit('close');
  }
</script>

<template>
  <UModal
    :title="modalTitle"
    :ui="{ content: 'sm:max-w-2xl' }"
  >
    <template #body>
      <div class="flex min-h-48 flex-col gap-4">
        <template v-if="step === 'class'">
          <SheetSearchInput
            v-model="searchTerm"
            :placeholder="SHEET_SEARCH_LABELS.byNamePlaceholder"
          />

          <div
            v-if="isListLoading"
            class="flex justify-center py-10"
          >
            <UIcon
              name="tabler:loader-2"
              class="size-6 animate-spin text-muted"
            />
          </div>

          <div
            v-else
            class="flex max-h-96 flex-col gap-1 overflow-y-auto pr-1"
          >
            <template
              v-for="row in displayRows"
              :key="row.url"
            >
              <div
                class="relative flex items-center gap-1 rounded-md pr-2 transition-colors hover:bg-elevated/60"
                :class="row.rowClass"
              >
                <UButton
                  v-if="row.hasSubclasses"
                  icon="tabler:chevron-right"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  square
                  class="relative z-10 shrink-0"
                  :aria-label="`Показать подклассы: ${row.name}`"
                  :ui="{
                    leadingIcon: `transition-transform ${row.chevronClass}`,
                  }"
                  @click.left.exact.prevent="handleChevronClick(row.url)"
                />

                <span
                  v-else
                  class="size-7 shrink-0"
                />

                <button
                  type="button"
                  class="flex min-w-0 grow cursor-pointer items-center gap-2 py-2 pr-1 text-left"
                  :aria-label="`Выбрать класс: ${row.name}`"
                  @click.left.exact.prevent="handleClassSelect(row.url)"
                >
                  <span
                    class="grow truncate text-sm font-medium text-highlighted"
                  >
                    {{ row.name }}
                  </span>
                </button>

                <UBadge
                  v-if="row.sourceLabel"
                  size="sm"
                  color="neutral"
                  variant="subtle"
                  class="shrink-0"
                >
                  {{ row.sourceLabel }}
                </UBadge>

                <UTooltip text="Открыть описание класса">
                  <UButton
                    icon="tabler:layout-sidebar-right-expand"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    square
                    class="relative z-10 shrink-0"
                    :aria-label="`Описание класса: ${row.name}`"
                    @click.left.exact.prevent="handlePreview(row.url)"
                  />
                </UTooltip>

                <UIcon
                  v-if="row.isSelected"
                  name="tabler:check"
                  class="size-4 shrink-0 text-primary"
                />
              </div>

              <div
                v-if="row.isExpanded || row.isSubclassesLoading"
                class="ml-5 flex flex-col gap-1 border-l border-default/50 pl-2"
              >
                <span
                  v-if="row.isSubclassesLoading"
                  class="flex items-center gap-2 px-3 py-1.5 text-xs text-muted"
                >
                  <UIcon
                    name="tabler:loader-2"
                    class="size-3.5 animate-spin"
                  />

                  Загрузка подклассов…
                </span>

                <div
                  v-for="subclass in row.subclasses"
                  :key="subclass.url"
                  class="relative flex items-center gap-1 rounded-md pr-2 transition-colors hover:bg-elevated/60"
                  :class="subclass.rowClass"
                >
                  <button
                    v-if="subclass.isSelectable"
                    type="button"
                    class="flex min-w-0 grow cursor-pointer items-center px-3 py-1.5 text-left after:absolute after:inset-0 after:cursor-pointer"
                    :aria-label="`Выбрать подкласс: ${subclass.name}`"
                    @click.left.exact.prevent="
                      handleSubclassClick(row.url, subclass.url)
                    "
                  >
                    <span class="grow truncate text-sm text-toned">
                      {{ subclass.name }}
                    </span>
                  </button>

                  <span
                    v-else
                    class="flex min-w-0 grow items-center px-3 py-1.5 text-left"
                  >
                    <span class="grow truncate text-sm text-dimmed">
                      {{ subclass.name }}
                    </span>
                  </span>

                  <UBadge
                    v-if="subclass.sourceLabel"
                    size="sm"
                    color="neutral"
                    variant="subtle"
                    class="relative z-10 shrink-0"
                  >
                    {{ subclass.sourceLabel }}
                  </UBadge>

                  <UTooltip text="Открыть описание подкласса">
                    <UButton
                      icon="tabler:layout-sidebar-right-expand"
                      color="neutral"
                      variant="ghost"
                      size="xs"
                      square
                      class="relative z-10 shrink-0"
                      :aria-label="`Описание подкласса: ${subclass.name}`"
                      @click.left.exact.prevent="handlePreview(subclass.url)"
                    />
                  </UTooltip>

                  <UIcon
                    v-if="subclass.isSelected"
                    name="tabler:check"
                    class="size-4 shrink-0 text-primary"
                  />
                </div>

                <span
                  v-if="!subclassAvailable && row.subclasses.length"
                  class="px-3 py-1 text-xs text-dimmed italic"
                >
                  Подкласс доступен с {{ SUBCLASS_SELECTION_MIN_LEVEL }} уровня
                </span>
              </div>
            </template>

            <span
              v-if="!displayRows.length"
              class="px-3 py-6 text-center text-sm text-dimmed"
            >
              Ничего не найдено
            </span>
          </div>

          <span
            v-if="isAddMode"
            class="text-xs text-muted"
          >
            {{ addModeHint }}
          </span>

          <span
            v-else
            class="text-xs text-muted"
          >
            Класс с подклассами разворачивается стрелкой — подкласс
            необязателен. При применении кость хитов, хиты, спасброски,
            владения, ресурсы, умения по текущему уровню и выбранный вариант
            стартового снаряжения сразу заполнят лист.
          </span>
        </template>

        <template v-else>
          <UAlert
            v-if="requirementWarning"
            color="warning"
            variant="subtle"
            icon="tabler:alert-triangle"
            :description="requirementWarning"
          />

          <div class="flex flex-wrap items-center gap-2 text-sm">
            <span class="text-muted">Класс:</span>

            <span class="font-bold text-highlighted">{{ resultName }}</span>
          </div>

          <!-- Лента вкладок: подписи разделов не сокращаются, поэтому на узком
            экране ряд не ужимается, а прокручивается -->
          <div class="-mx-1 hidden-scrollbar overflow-x-auto px-1">
            <UTabs
              :items="reviewTabItems"
              :model-value="reviewTab"
              :content="false"
              color="primary"
              variant="pill"
              :ui="{ list: 'w-max min-w-full', trigger: 'shrink-0' }"
              @update:model-value="handleReviewTabChange"
            />
          </div>

          <!-- Высота раздела задана снизу: без неё модалка прыгала бы на
            каждом переключении вкладки -->
          <div class="flex min-h-56 flex-col gap-3">
            <template v-if="reviewTab === 'overview'">
              <div :class="REVIEW_SECTION_CLASS">
                <div class="flex flex-wrap gap-4">
                  <div class="flex flex-col gap-1">
                    <span
                      class="text-[10px] font-bold tracking-wider text-muted uppercase"
                    >
                      Кость хитов
                    </span>

                    <span class="text-sm font-medium text-highlighted">
                      {{ hitDieLabel }}
                    </span>
                  </div>

                  <div class="flex flex-col gap-1">
                    <span
                      class="text-[10px] font-bold tracking-wider text-muted uppercase"
                    >
                      Хиты
                    </span>

                    <span class="text-sm font-medium text-highlighted">
                      {{ maxHitPointsPreview }}
                    </span>
                  </div>

                  <div
                    v-if="!isAddMode"
                    class="flex flex-col gap-1"
                  >
                    <span
                      class="text-[10px] font-bold tracking-wider text-muted uppercase"
                    >
                      Спасброски
                    </span>

                    <div class="flex flex-wrap gap-2">
                      <UBadge
                        v-for="label in savingThrowLabels"
                        :key="label"
                        size="lg"
                        color="primary"
                        variant="subtle"
                      >
                        {{ label }}
                      </UBadge>

                      <span
                        v-if="!savingThrowLabels.length"
                        class="text-sm text-dimmed italic"
                      >
                        {{ classDetail?.savingThrowsText || 'не распознаны' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div
                v-if="multiclassProficiencyRows.length"
                :class="REVIEW_SECTION_CLASS"
              >
                <span
                  class="text-[10px] font-bold tracking-wider text-muted uppercase"
                >
                  {{ MULTICLASS_PROFICIENCY_LABELS.title }}
                </span>

                <span class="text-xs text-dimmed">
                  {{ MULTICLASS_PROFICIENCY_LABELS.hint }}
                </span>

                <div
                  v-for="row in multiclassProficiencyRows"
                  :key="row.key"
                  class="flex flex-col gap-0.5"
                >
                  <span class="text-xs text-muted">{{ row.label }}</span>

                  <span class="text-sm text-toned">{{ row.value }}</span>
                </div>
              </div>

              <div
                v-else-if="proficiencyChips.length"
                :class="REVIEW_SECTION_CLASS"
              >
                <span
                  class="text-[10px] font-bold tracking-wider text-muted uppercase"
                >
                  Владения (распознаны, проверьте вручную)
                </span>

                <div class="flex flex-wrap gap-2">
                  <UBadge
                    v-for="chip in proficiencyChips"
                    :key="chip"
                    size="lg"
                    color="neutral"
                    variant="subtle"
                  >
                    {{ chip }}
                  </UBadge>
                </div>
              </div>

              <div
                v-if="classChoices.length"
                :class="REVIEW_SECTION_CLASS"
              >
                <span
                  class="text-[10px] font-bold tracking-wider text-muted uppercase"
                >
                  Выборы владений
                </span>

                <div
                  v-for="choice in classChoices"
                  :key="choice.id"
                  class="flex flex-col gap-1"
                >
                  <span class="text-xs text-muted">
                    {{ choice.label }} (выберите {{ choiceCount(choice) }})
                  </span>

                  <SheetChoiceSelect
                    :model-value="selections[choice.id] ?? []"
                    :items="choiceOptions(choice)"
                    :hints="choiceHints(choice)"
                    :warning="SKILL_DUPLICATE_WARNING"
                    :count="choiceCount(choice)"
                    :placeholder="`Выберите ${choiceCount(choice)}`"
                    @update:model-value="updateSelection(choice, $event)"
                  />
                </div>
              </div>
            </template>

            <template v-else-if="reviewTab === 'equipment'">
              <SheetStartingEquipmentChoice
                v-model="startingEquipmentLabel"
                :options="startingEquipmentOptions"
              />
            </template>

            <template v-else>
              <div class="flex flex-col gap-2">
                <span
                  class="text-[10px] font-bold tracking-wider text-muted uppercase"
                >
                  Умения (до {{ level }} уровня)
                </span>

                <div
                  v-for="row in featureRows"
                  :key="row.id"
                  class="flex flex-col gap-2 rounded-lg border border-default/50 bg-elevated/20 p-3"
                >
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-sm font-bold text-highlighted">
                      {{ row.name }}
                    </span>

                    <UBadge
                      size="sm"
                      color="neutral"
                      variant="subtle"
                    >
                      {{ row.originLabel }} · {{ row.level }} ур.
                    </UBadge>
                  </div>

                  <!-- Выборы черты — боевой стиль, черта за повышение
                характеристик — тем же пикером, что в мастере повышения -->
                  <div
                    v-if="row.featChoices.length"
                    class="flex flex-col gap-3"
                  >
                    <SheetLevelUpFeatChoice
                      v-for="choice in row.featChoices"
                      :key="choice.id"
                      :title="choice.label"
                      :options="featOptions(choice)"
                      :selected="selectedFeat(choice.id)"
                      :abilities="featAbilities(choice.id)"
                      :scores="character.abilities"
                      :is-loading="isFeatsLoading"
                      :has-error="hasFeatsError"
                      @update:feat="setFeatChoice(row.id, choice.id, $event)"
                      @update:ability="setFeatAbility(choice.id, $event)"
                    />
                  </div>

                  <div
                    v-if="row.choiceControls.length"
                    class="flex flex-col gap-3"
                  >
                    <div
                      v-for="control in row.choiceControls"
                      :key="control.id"
                      class="flex flex-col gap-1"
                    >
                      <span class="text-xs text-muted">
                        {{
                          control.label || `Выберите ${choiceCount(control)}`
                        }}
                      </span>

                      <SheetChoiceSelect
                        :model-value="selections[control.id] ?? []"
                        :items="choiceOptions(control)"
                        :hints="choiceHints(control)"
                        :warning="SKILL_DUPLICATE_WARNING"
                        :count="choiceCount(control)"
                        :placeholder="`Выберите ${choiceCount(control)}`"
                        @update:model-value="updateSelection(control, $event)"
                      />
                    </div>
                  </div>

                  <UInput
                    v-if="!row.featChoices.length && !row.choiceControls.length"
                    v-model="choices[row.id]"
                    size="sm"
                    placeholder="Ваш выбор в умении (необязательно)"
                  />

                  <MarkupRender
                    :render-node="row.description"
                    class="text-sm"
                  />
                </div>
              </div>
            </template>
          </div>
        </template>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full flex-wrap items-center justify-between gap-2">
        <UButton
          v-if="step === 'review'"
          label="Назад"
          icon="tabler:arrow-left"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="handleBack"
        />

        <UButton
          v-else
          :label="CUSTOM_CLASS_LABELS.openButton"
          icon="tabler:plus"
          color="neutral"
          variant="subtle"
          @click.left.exact.prevent="handleCustomClass"
        />

        <div class="ml-auto flex gap-2">
          <UButton
            label="Отмена"
            color="neutral"
            variant="ghost"
            @click.left.exact.prevent="handleCancel"
          />

          <UButton
            v-if="step === 'review'"
            label="Применить"
            color="primary"
            :loading="isApplying"
            :disabled="isApplyDisabled"
            @click.left.exact.prevent="handleApply"
          />

          <UButton
            v-else
            label="Далее"
            icon="tabler:arrow-right"
            color="primary"
            :loading="isStepLoading"
            :disabled="isNextDisabled"
            @click.left.exact.prevent="handleNext"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
