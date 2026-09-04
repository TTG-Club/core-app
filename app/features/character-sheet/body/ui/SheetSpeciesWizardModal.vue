<script setup lang="ts">
  import type {
    AbilityKey,
    CharacterFeature,
    CharacterInnateSpell,
    ClassChoice,
    FeatSelectOption,
    FeatureDescriptionNode,
    FeatureOrigin,
    LevelUpFeatChoice,
    SheetChoiceControl,
    SheetChoiceOrigin,
    SpeciesFeatureSummary,
    SpeciesOption,
    SpeciesSummary,
  } from '../../model';

  import { partition } from 'es-toolkit';

  import { ACTION_LABELS } from '~/shared/consts';
  import { SpeciesDrawer } from '~species/drawer';
  import { MarkupRender } from '~ui/markup';

  import {
    useCatalogSourceQuery,
    useCharacterSheet,
    useChoiceSpellPools,
    useLazyCatalogSourceQuery,
    useToolCatalog,
  } from '../../composables';
  import {
    ABILITY_IMPROVEMENT_LABELS,
    ABILITY_LABELS,
    buildCharacterFeatures,
    buildChoiceControl,
    buildFeatFeature,
    CLASS_FEAT_CHOICE_ID_SEGMENT,
    collectChosenProficiencies,
    collectFeatAbilityIncreases,
    collectSpeciesProficiencies,
    CURRENT_SELECTION_LABELS,
    CUSTOM_SPECIES_LABELS,
    detectFeatureChoice,
    FEAT_SOURCES_ASYNC_DATA_KEY,
    FEATS_FILTERS_PATH,
    FEATS_SELECT_PATH,
    FEATURE_ORIGIN_LABELS,
    fetchFeatDetail,
    filterChoicesByLevel,
    getCharacterFeatureId,
    getChoiceModalSubtitle,
    getChoiceSkillHints,
    getChosenProficientSkills,
    getFeatChoiceOptions,
    getFeatUrlFromFeatureId,
    getOwnedWeaponNames,
    getSpeciesDarkvision,
    getSpeciesVision,
    getSpellChoicesKey,
    getToolNames,
    LANGUAGE_PROFICIENCY_GROUPS,
    ORIGIN_FEAT_ACQUISITION_LEVEL,
    parseFeatSelectOptions,
    parseSizeOptionsFromText,
    parseSpeciesDetail,
    parseSpeciesLineages,
    parseSpeciesOptions,
    parseSpeedFromText,
    resolveChoiceOptions,
    SHEET_SEARCH_LABELS,
    SKILL_DUPLICATE_WARNING,
    SPECIES_DETAIL_BASE_PATH,
    SPECIES_FEAT_INVALID_RESPONSE_ERROR,
    SPECIES_FILTERS_PATH,
    SPECIES_SEARCH_PATH,
    SPECIES_WIZARD_LABELS,
    unionToolProficiencies,
    withChosenFeatureSpells,
  } from '../../model';
  import SheetChoicePickerField from './SheetChoicePickerField.vue';
  import SheetCurrentSelectionPanel from './SheetCurrentSelectionPanel.vue';
  import SheetCustomSpeciesModal from './SheetCustomSpeciesModal.vue';
  import SheetFeatChoiceField from './SheetFeatChoiceField.vue';
  import SheetSearchInput from './SheetSearchInput.vue';

  type WizardStep = 'species' | 'features';

  /** Загруженная черта, выбранная в умении вида или подвида. */
  interface SpeciesFeatSelection {
    /** Идентификатор строки умения (`species:{featureUrl}`). */
    rowId: string;

    /** Название черты — идёт в подпись выбора у самого умения. */
    featName: string;

    /** Готовая запись особенности для листа. */
    feature: CharacterFeature;
  }

  /**
   * Разносит выборы умения по пикерам: черту выбирают окном каталога, всё
   * остальное — селектами. Пул черты — весь раздел сайта, и в `listed` у неё
   * лежат url, а не названия: селектом её не показать.
   *
   * @param choices выборы умения.
   * @returns выборы селектов и выборы черты.
   */
  function splitFeatChoices(choices: ClassChoice[]): {
    choiceControls: ClassChoice[];
    featChoices: ClassChoice[];
  } {
    const [featChoices, choiceControls] = partition(
      choices,
      (choice) => choice.kind === 'feat',
    );

    return { choiceControls, featChoices };
  }

  /** Объединяет заклинания вида и происхождения, сохраняя самый ранний уровень открытия. */
  function mergeInnateSpells(
    speciesSpells: CharacterInnateSpell[],
    lineageSpells: CharacterInnateSpell[],
  ): CharacterInnateSpell[] {
    const spellsByUrl = new Map<string, CharacterInnateSpell>();

    for (const innateSpell of [...speciesSpells, ...lineageSpells]) {
      const existingSpell = spellsByUrl.get(innateSpell.spell.url);

      if (
        !existingSpell
        || innateSpell.requiredLevel < existingSpell.requiredLevel
      ) {
        spellsByUrl.set(innateSpell.spell.url, innateSpell);
      }
    }

    return [...spellsByUrl.values()];
  }

  const emit = defineEmits<{
    close: [];
  }>();

  const toast = useToast();

  const overlay = useOverlay();

  const { character, setSpecies, removeSpecies } = useCharacterSheet();

  // Дровер описания вида с сайта; без destroyOnClose — повторный open()
  // после закрытия иначе падает («Overlay not found»).
  const speciesPreviewDrawer = overlay.create(SpeciesDrawer, {
    props: {
      url: '',
      onClose: () => speciesPreviewDrawer.close(),
    },
  });

  // Свой вид собирается в отдельной модалке поверх списка: сама она и применяет
  // его к листу, поэтому мастер после успеха только закрывается, а отмена
  // возвращает к списку каталога.
  const customSpeciesModal = overlay.create(SheetCustomSpeciesModal);

  function handlePreview(url: string) {
    speciesPreviewDrawer.open({ url });
  }

  async function handleCustomSpecies() {
    const isCreated = await customSpeciesModal.open();

    if (isCreated) {
      emit('close');
    }
  }

  const step = ref<WizardStep>('species');

  // Источники берутся из глобальной настройки профиля — визард не показывает
  // виды из отключённых книг. Запрос ждём до списка: иначе первая выдача
  // пришла бы по всем источникам и мигнула лишними строками.
  const { sourceQuery } = await useCatalogSourceQuery(
    'character-sheet:species-sources',
    SPECIES_FILTERS_PATH,
  );

  // Полный список видов загружается сразу при открытии визарда.
  const { data: speciesList, status: listStatus } = await useAsyncData(
    'character-sheet:species-list',
    async () => {
      const response = await $fetch<unknown>(SPECIES_SEARCH_PATH, {
        method: 'GET',
        query: { ...sourceQuery.value },
        retry: 0,
      });

      return parseSpeciesOptions(response);
    },
    { server: false },
  );

  const isListLoading = computed(() => listStatus.value === 'pending');

  const searchTerm = ref('');

  const selectedOption = ref<SpeciesOption | undefined>();

  const selectedLineage = ref<SpeciesSummary | null>(null);

  const expandedUrls = ref(new Set<string>());

  const lineagesByUrl = ref<Record<string, SpeciesSummary[]>>({});

  const loadingLineagesUrl = ref<string | null>(null);

  const speciesDetail = ref<SpeciesSummary | null>(null);

  const isStepLoading = ref(false);

  const isApplying = shallowRef(false);

  const sizeChoice = ref<string | undefined>();

  const choices = ref<Record<string, string>>({});

  /** Черновик выборов-селекторов по id выбора: id → выбранные значения. */
  const selections = ref<Record<string, string[]>>({});

  /** Выборы черты по идентификатору выбора умения вида. */
  const featSelections = ref<Record<string, LevelUpFeatChoice>>({});

  /** Каталог черт для выборов черты в умениях; грузится, когда они есть. */
  const featCatalog = ref<FeatSelectOption[]>([]);

  const isFeatsLoading = ref(false);

  const hasFeatsError = ref(false);

  // Источники черт — та же глобальная настройка профиля, что у остальных
  // каталогов. Лениво: `/feats/select` по источникам не фильтрует, отбор идёт
  // на клиенте, и виду без выбора черты эти фильтры не нужны вовсе.
  const { selectedSourceIds: featSourceIds, load: loadFeatSources } =
    useLazyCatalogSourceQuery(FEAT_SOURCES_ASYNC_DATA_KEY, FEATS_FILTERS_PATH);

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

  // Инструменты виды не выдают (`detectFeatureChoice` их не распознаёт), но
  // контекст резолва выборов общий — список тянем из каталога сайта, а не из
  // своего перечня.
  const {
    getToolNamesForGroups,
    catalogItems: toolCatalogItems,
    load: loadToolCatalog,
  } = useToolCatalog();

  void loadToolCatalog();

  const filteredOptions = computed(() => {
    const query = searchTerm.value.trim().toLowerCase();

    const list = speciesList.value ?? [];

    if (!query) {
      return list;
    }

    return list.filter((option) => option.name.toLowerCase().includes(query));
  });

  const displayRows = computed(() =>
    filteredOptions.value.map((option) => {
      const isExpanded = expandedUrls.value.has(option.url);

      const isSelected =
        !option.hasLineages && selectedOption.value?.url === option.url;

      return {
        ...option,
        isExpanded,
        isSelected,
        isLineagesLoading: loadingLineagesUrl.value === option.url,
        rowClass: isSelected ? 'bg-elevated' : '',
        chevronClass: isExpanded ? 'rotate-90' : '',
        lineages: (lineagesByUrl.value[option.url] ?? []).map((lineage) => {
          const isLineageSelected =
            selectedOption.value?.url === option.url
            && selectedLineage.value?.url === lineage.url;

          return {
            url: lineage.url,
            name: lineage.name,
            isSelected: isLineageSelected,
            rowClass: isLineageSelected ? 'bg-elevated' : '',
          };
        }),
      };
    }),
  );

  /** Свойства подвида приоритетнее свойств базового вида. */
  const effectiveSizeText = computed(
    () =>
      selectedLineage.value?.sizeText || speciesDetail.value?.sizeText || '',
  );

  const effectiveSpeedText = computed(
    () =>
      selectedLineage.value?.speedText || speciesDetail.value?.speedText || '',
  );

  const sizeOptions = computed(() =>
    parseSizeOptionsFromText(effectiveSizeText.value),
  );

  const showSizeChoice = computed(() => sizeOptions.value.length > 1);

  const resultName = computed(() => {
    if (!speciesDetail.value) {
      return '';
    }

    return selectedLineage.value
      ? `${speciesDetail.value.name} (${selectedLineage.value.name})`
      : speciesDetail.value.name;
  });

  /**
   * Выборы умения: структурные из справочника, а без них — распознанные по
   * прозе описания. Структура точнее прозы (у неё явные вид, пул и количество),
   * поэтому имеет приоритет; проза остаётся страховкой для умений, которым
   * выбор ещё не проставили в форме вида.
   *
   * @param id идентификатор умения на листе.
   * @param feature умение вида или происхождения.
   * @returns выборы умения; пусто — умение ни о чём не спрашивает.
   */
  function featureChoiceControls(
    id: string,
    feature: SpeciesFeatureSummary,
  ): ClassChoice[] {
    if (feature.choices.length > 0) {
      // Выбор со своим уровнем спрашивается, только когда персонаж дорос:
      // умение вида приходит целиком, а часть его вопросов открывается позже
      return filterChoicesByLevel(feature.choices, character.value.level);
    }

    const detected = detectFeatureChoice(
      id,
      feature.description,
      skillNames.value,
    );

    return detected ? [detected] : [];
  }

  const featureRows = computed(() => {
    const rows: Array<{
      id: string;
      name: string;
      description: FeatureDescriptionNode[];
      origin: FeatureOrigin;
      originName: string;
      originLabel: string;
      choiceControls: ClassChoice[];
      featChoices: ClassChoice[];
    }> = [];

    const detail = speciesDetail.value;

    if (detail) {
      // Выборы самой записи вида: у происхождений умений не бывает, и спросить
      // их было бы негде. Своей строкой, потому что и дают их не умения
      if (detail.choices.length > 0) {
        rows.push({
          id: getCharacterFeatureId('species', detail.url),
          name: detail.name,
          description: [],
          origin: 'species',
          originName: detail.name,
          originLabel: `${FEATURE_ORIGIN_LABELS.species}: ${detail.name}`,
          ...splitFeatChoices(detail.choices),
        });
      }

      for (const feature of detail.features) {
        const id = getCharacterFeatureId('species', feature.url);

        rows.push({
          id,
          name: feature.name,
          description: feature.description,
          origin: 'species',
          originName: detail.name,
          originLabel: `${FEATURE_ORIGIN_LABELS.species}: ${detail.name}`,
          ...splitFeatChoices(featureChoiceControls(id, feature)),
        });
      }
    }

    const lineage = selectedLineage.value;

    if (lineage) {
      if (lineage.choices.length > 0) {
        rows.push({
          id: getCharacterFeatureId('lineage', lineage.url),
          name: lineage.name,
          description: [],
          origin: 'lineage',
          originName: lineage.name,
          originLabel: `${FEATURE_ORIGIN_LABELS.lineage}: ${lineage.name}`,
          ...splitFeatChoices(lineage.choices),
        });
      }

      for (const feature of lineage.features) {
        const id = getCharacterFeatureId('lineage', feature.url);

        rows.push({
          id,
          name: feature.name,
          description: feature.description,
          origin: 'lineage',
          originName: lineage.name,
          originLabel: `${FEATURE_ORIGIN_LABELS.lineage}: ${lineage.name}`,
          ...splitFeatChoices(featureChoiceControls(id, feature)),
        });
      }
    }

    return rows;
  });

  /** Все выборы мастера: по ним считается, что уже выбрано во владение. */
  const allChoices = computed<ClassChoice[]>(() =>
    featureRows.value.flatMap((row) => row.choiceControls),
  );

  // Пул заклинаний собирается поиском по каталогу, а не лежит в записи вида:
  // умение, дающее заговор из списка волшебника, перечислило бы весь список, и
  // тот устарел бы при первом же пополнении справочника
  const {
    getPool: getSpellPool,
    getSpellOptions,
    getStatus: getSpellPoolStatus,
    collectChosenSpells,
    load: loadSpellPools,
    retry: retrySpellPool,
  } = useChoiceSpellPools({
    sources: () =>
      featureRows.value.map((row) => ({ choices: row.choiceControls })),
    answers: selections,
  });

  /**
   * Примета выборов заклинаний, которые мастер спрашивает сейчас: они приходят
   * вместе с выбранным видом и подвидом, поэтому пул догружается по её смене.
   */
  const spellChoicesKey = computed(() => getSpellChoicesKey(allChoices.value));

  // Цикла нет: обработчик правит только пулы заклинаний, а примета считается по
  // выборам мастера — от загруженного пула она не меняется.
  watch(spellChoicesKey, handleSpellChoicesChange);

  /** Догружает пулы заклинаний под выборы, которые мастер спрашивает сейчас. */
  function handleSpellChoicesChange(): void {
    void loadSpellPools();
  }

  /** Есть ли у вида выбор черты: по нему грузится каталог черт. */
  const hasFeatChoices = computed(() =>
    featureRows.value.some((row) => row.featChoices.length > 0),
  );

  /** Опции пикера выбора в зависимости от его типа. */
  function choiceOptions(choice: ClassChoice): string[] {
    // Заклинания приходят загруженным пулом, а не резолвятся по типу выбора: в
    // самой записи вида их нет.
    if (choice.kind === 'spell') {
      return getSpellOptions(choice);
    }

    return resolveChoiceOptions(choice, {
      skillNames: skillNames.value,
      proficientSkillNames: proficientSkillNames.value,
      chosenProficientSkills: getChosenProficientSkills(
        allChoices.value,
        selections.value,
        choice.id,
      ),
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
    });
  }

  /** Пометки опций: навыки, которыми персонаж уже владеет. */
  function choiceHints(choice: ClassChoice): Record<string, string> {
    return getChoiceSkillHints(choice, character.value.skills);
  }

  /**
   * Выбор для единого пикера: варианты, готовность пула, подписи поля и окна.
   *
   * @param choice выбор умения.
   * @param origin умение и его источник — для подзаголовка окна.
   * @returns выбор для пикера.
   */
  function choiceControl(
    choice: ClassChoice,
    origin?: SheetChoiceOrigin,
  ): SheetChoiceControl {
    return buildChoiceControl(choice, {
      names: choiceOptions(choice),
      hints: choiceHints(choice),
      spellPool: getSpellPool(choice),
      status: choice.kind === 'spell' ? getSpellPoolStatus(choice) : 'ready',
      toolEntries: toolCatalogItems.value,
      origin,
    });
  }

  /**
   * Откуда выбор строки умения: у вида уровня нет, и в подзаголовке окна
   * остаются источник и название умения.
   *
   * @param row строка умения.
   * @returns источник выбора.
   */
  function rowOrigin(row: {
    name: string;
    originLabel: string;
  }): SheetChoiceOrigin {
    return { featureName: row.name, originLabel: row.originLabel, level: null };
  }

  /**
   * Выборы умений единым пикером по идентификаторам строк. Отдельным
   * computed, а не полем строки: пикер считает пул по всем выборам мастера, а
   * те собираются из самих строк — поле замкнуло бы круг.
   */
  const featureRowControls = computed<Record<string, SheetChoiceControl[]>>(
    () =>
      Object.fromEntries(
        featureRows.value.map((row) => [
          row.id,
          row.choiceControls.map((choice) =>
            choiceControl(choice, rowOrigin(row)),
          ),
        ]),
      ),
  );

  /** Подзаголовки окон выбора черты по идентификаторам строк умений. */
  const featureRowModalSubtitles = computed<Record<string, string>>(() =>
    Object.fromEntries(
      featureRows.value.map((row) => [
        row.id,
        getChoiceModalSubtitle(rowOrigin(row), 1),
      ]),
    ),
  );

  /** Требуемое число опций с учётом готовности пула. */
  function choiceCount(choice: ClassChoice): number {
    return choiceControl(choice).requiredCount;
  }

  /** Обновление выбора с ограничением по требуемому количеству. */
  function updateSelection(choice: ClassChoice, values: string[]): void {
    const count = choiceCount(choice);

    selections.value = {
      ...selections.value,
      [choice.id]: count > 0 ? values.slice(0, count) : values,
    };
  }

  /** Пул заклинаний выбора не загрузился — запросить его заново. */
  function handleSpellPoolRetry(choice: ClassChoice): void {
    void retrySpellPool(choice);
  }

  /**
   * Каталог черт для выборов в умениях вида. Список берётся целиком с
   * `/select`: только он отдаёт повторяемость и прибавки к характеристикам, а
   * категории и уже взятые черты отбираются на клиенте — как в мастере класса.
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
   * Черты, доступные выбору черты в умении вида: пул сужен категориями и
   * перечнем выбора, уже взятыми чертами и выбранными в других умениях мастера.
   *
   * @param choice выбор черты умения.
   * @returns черты для пикера.
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

  const isNextDisabled = computed(() => {
    if (!selectedOption.value) {
      return true;
    }

    return selectedOption.value.hasLineages && !selectedLineage.value;
  });

  function showLoadError() {
    toast.add({
      color: 'error',
      icon: 'tabler:alert-triangle',
      title: 'Не удалось загрузить данные вида',
    });
  }

  /** Тост о том, что выбранную черту не удалось догрузить перед применением. */
  function showFeatError() {
    toast.add({
      color: 'error',
      icon: 'tabler:alert-triangle',
      title: ABILITY_IMPROVEMENT_LABELS.applyError,
    });
  }

  function findSpeciesOption(speciesUrl: string): SpeciesOption | undefined {
    return (speciesList.value ?? []).find(
      (option) => option.url === speciesUrl,
    );
  }

  async function fetchSpeciesDetail(
    url: string,
  ): Promise<SpeciesSummary | null> {
    const response = await $fetch<unknown>(
      `${SPECIES_DETAIL_BASE_PATH}/${url}`,
      { method: 'GET', retry: 0 },
    );

    return parseSpeciesDetail(response);
  }

  async function fetchLineages(url: string): Promise<SpeciesSummary[]> {
    const response = await $fetch<unknown>(
      `${SPECIES_DETAIL_BASE_PATH}/${url}/lineages`,
      { method: 'GET', retry: 0 },
    );

    return parseSpeciesLineages(response);
  }

  async function toggleLineages(option: SpeciesOption) {
    if (expandedUrls.value.has(option.url)) {
      expandedUrls.value.delete(option.url);

      return;
    }

    if (!lineagesByUrl.value[option.url]) {
      loadingLineagesUrl.value = option.url;

      try {
        lineagesByUrl.value[option.url] = await fetchLineages(option.url);
      } catch (error) {
        consola.error('Ошибка загрузки подвидов:', error);
        showLoadError();

        return;
      } finally {
        loadingLineagesUrl.value = null;
      }
    }

    expandedUrls.value.add(option.url);
  }

  function handleSpeciesRowClick(speciesUrl: string) {
    const option = findSpeciesOption(speciesUrl);

    if (!option) {
      return;
    }

    // Вид с подвидами клик разворачивает; выбирается конкретный подвид.
    if (option.hasLineages) {
      void toggleLineages(option);

      return;
    }

    selectedOption.value = option;
    selectedLineage.value = null;
  }

  function handleLineageClick(speciesUrl: string, lineageUrl: string) {
    const option = findSpeciesOption(speciesUrl);

    const lineage = lineagesByUrl.value[speciesUrl]?.find(
      (lineageSummary) => lineageSummary.url === lineageUrl,
    );

    if (!option || !lineage) {
      return;
    }

    selectedOption.value = option;
    selectedLineage.value = lineage;
  }

  async function handleNext() {
    const option = selectedOption.value;

    if (!option || isStepLoading.value || isNextDisabled.value) {
      return;
    }

    isStepLoading.value = true;

    try {
      speciesDetail.value = await fetchSpeciesDetail(option.url);

      if (!speciesDetail.value) {
        showLoadError();

        return;
      }

      choices.value = {};
      selections.value = {};
      featSelections.value = {};
      sizeChoice.value = sizeOptions.value[0];

      // Каталог черт нужен только виду с выбором черты: иначе лишний запрос на
      // каждое открытие мастера
      if (hasFeatChoices.value && !featCatalog.value.length) {
        await loadFeats();
      }

      step.value = 'features';
    } catch (error) {
      consola.error('Ошибка загрузки вида:', error);
      showLoadError();
    } finally {
      isStepLoading.value = false;
    }
  }

  function handleBack() {
    step.value = 'species';
  }

  /**
   * Загружает черты, выбранные в умениях вида, и делает их записями листа.
   * Происхождение у записи вида или подвида — тогда смена вида забирает черту
   * вместе с умением, которое её дало.
   *
   * @returns записи выбранных черт; пусто — черту нигде не выбрали.
   */
  function buildSpeciesFeatFeatures(): Promise<SpeciesFeatSelection[]> {
    const entries = featureRows.value.flatMap((row) =>
      row.featChoices.flatMap((choice) => {
        const selection = featSelections.value[choice.id];

        return selection?.featUrl ? [{ row, choice, selection }] : [];
      }),
    );

    return Promise.all(
      entries.map(async ({ row, choice, selection }) => {
        const summary = await fetchFeatDetail(selection.featUrl);

        if (!summary) {
          throw new Error(SPECIES_FEAT_INVALID_RESPONSE_ERROR);
        }

        return {
          rowId: row.id,
          featName: summary.name,
          feature: {
            ...buildFeatFeature(summary, {
              // Черта вида даётся вместе с умением: у большинства это первый
              // уровень, а от уровня взятия считается прибавка «Крепкого»
              level: choice.requiredLevel || ORIGIN_FEAT_ACQUISITION_LEVEL,
              origin: row.origin,
              originName: row.originName,
              abilityIncreases: collectFeatAbilityIncreases(
                selection.abilities,
              ),
            }),
            id: `${row.id}:${CLASS_FEAT_CHOICE_ID_SEGMENT}:${summary.url}`,
          },
        };
      }),
    );
  }

  /**
   * Применяет вид к листу: сперва догружает выбранные черты, затем одним
   * обновлением кладёт вид, его умения, владения и записи черт.
   */
  async function handleApply() {
    const detail = speciesDetail.value;

    if (!detail || isApplying.value) {
      return;
    }

    // Под `try` только загрузка черт: ошибка сети не должна выглядеть как сбой
    // применения вида, а применение ниже — синхронное и не бросает.
    let featFeatures: SpeciesFeatSelection[];

    isApplying.value = true;

    try {
      featFeatures = await buildSpeciesFeatFeatures();
    } catch (error) {
      consola.error(ABILITY_IMPROVEMENT_LABELS.applyErrorLog, error);
      showFeatError();

      return;
    } finally {
      isApplying.value = false;
    }

    const lineage = selectedLineage.value;

    // Сбор выборов-селекторов: навыки (владение/экспертиза) и языки; выбранные
    // значения также идут в текст особенности, чтобы отображаться на листе.
    const proficientSkills: string[] = [];
    const expertiseSkills: string[] = [];
    const chosenLanguages: string[] = [];
    const featureChoices: Record<string, string> = { ...choices.value };

    const featureControls = featureRows.value.flatMap(
      (row) => row.choiceControls,
    );

    for (const control of featureControls) {
      const values = selections.value[control.id] ?? [];

      if (!values.length) {
        continue;
      }

      if (control.kind === 'skill-proficiency') {
        proficientSkills.push(...values);
      } else if (control.kind === 'skill-expertise') {
        expertiseSkills.push(...values);
      } else if (control.kind === 'language') {
        chosenLanguages.push(...values);
      }

      featureChoices[control.id] = values.join(', ');
    }

    // Названия выбранных черт — в подпись самого умения: на листе видно, что
    // именно дала «Универсальность»
    for (const selection of featFeatures) {
      const previous = featureChoices[selection.rowId];

      featureChoices[selection.rowId] = previous
        ? `${previous}, ${selection.featName}`
        : selection.featName;
    }

    // Инструменты, приёмы и владения спасбросками из ответов: их лист кладёт в
    // свои списки владений, а не в текст умения. Разбор ответов общий с чертой —
    // вид выбора у них один и тот же
    const chosenGrants = collectChosenProficiencies(
      featureControls,
      selections.value,
      proficientSkillNames.value,
    );

    // Дары, заявленные записью вида и её умениями: до них лист искал владения
    // в прозе описания и умение с непривычной формулировкой пропускал
    const declaredProficiencies = collectSpeciesProficiencies(
      detail,
      lineage,
      character.value.level,
    );

    setSpecies({
      species: {
        url: detail.url,
        name: detail.name,
        lineageUrl: lineage?.url ?? null,
        lineageName: lineage?.name ?? null,
        innateSpells: mergeInnateSpells(
          detail.innateSpells,
          lineage?.innateSpells ?? [],
        ),
      },
      size: sizeChoice.value ?? null,
      speed: parseSpeedFromText(effectiveSpeedText.value),
      vision: {
        // Вид задаёт обычное зрение — берём его; иначе оставляем своё
        normal:
          getSpeciesVision(detail, lineage) ?? character.value.vision.normal,
        darkvision: getSpeciesDarkvision(detail, lineage),
        blindsight: character.value.vision.blindsight,
        tremorsense: character.value.vision.tremorsense,
        truesight: character.value.vision.truesight,
        unit: 'feet',
      },
      // Выбранные заклинания — на записи своих умений: лист ведёт их наравне
      // с врождёнными заклинаниями вида, и снятие вида забирает их вместе с
      // умением
      features: withChosenFeatureSpells(
        [
          ...buildCharacterFeatures(
            detail,
            lineage,
            featureChoices,
            character.value.level,
          ),
          ...featFeatures.map((selection) => selection.feature),
        ],
        Object.fromEntries(
          featureRows.value.map((row) => [
            row.id,
            collectChosenSpells({ choices: row.choiceControls }),
          ]),
        ),
      ),
      skills: {
        // Навыки из даров вида идут туда же, куда выбранные игроком: лист
        // ставит владение строке навыка, а не списку владений
        proficient: [
          ...new Set([...declaredProficiencies.skills, ...proficientSkills]),
        ],
        expertise: [
          ...new Set([
            ...declaredProficiencies.expertiseSkills,
            ...expertiseSkills,
          ]),
        ],
      },
      proficiencies: {
        ...declaredProficiencies,
        languages: [
          ...new Set([
            ...declaredProficiencies.languages,
            ...(chosenGrants.languages ?? []),
            ...chosenLanguages,
          ]),
        ],
        tools: unionToolProficiencies(
          declaredProficiencies.tools,
          chosenGrants.tools ?? [],
        ),
        weaponMasteries: [
          ...new Set([
            ...declaredProficiencies.weaponMasteries,
            ...(chosenGrants.weaponMasteries ?? []),
          ]),
        ],
        masteryProperties: [
          ...new Set([
            ...declaredProficiencies.masteryProperties,
            ...(chosenGrants.masteryProperties ?? []),
          ]),
        ],
        savingThrows: [
          ...new Set([
            ...declaredProficiencies.savingThrows,
            ...(chosenGrants.savingThrows ?? []),
          ]),
        ],
      },
    });

    emit('close');
  }

  /** Название уже взятого вида с подвидом; пусто — вида на листе нет. */
  const currentSpeciesLabel = computed(() => {
    const species = character.value.species;

    if (!species) {
      return '';
    }

    return species.lineageName
      ? `${species.name} (${species.lineageName})`
      : species.name;
  });

  /** Снимает вид и закрывает мастер: брать новый взамен необязательно. */
  function handleRemoveSpecies() {
    removeSpecies();

    emit('close');
  }

  function handleCancel() {
    emit('close');
  }
</script>

<template>
  <UModal
    :title="SPECIES_WIZARD_LABELS.title"
    :ui="{ content: 'sm:max-w-2xl' }"
  >
    <template #body>
      <div class="flex min-h-48 flex-col gap-4">
        <template v-if="step === 'species'">
          <!-- Что уже взято и как это снять: выбирать новый вид взамен
          необязательно -->
          <SheetCurrentSelectionPanel
            v-if="currentSpeciesLabel"
            :title="CURRENT_SELECTION_LABELS.species.title"
            :name="currentSpeciesLabel"
            :remove-label="CURRENT_SELECTION_LABELS.species.remove"
            :remove-description="
              CURRENT_SELECTION_LABELS.species.removeDescription
            "
            @remove="handleRemoveSpecies"
          />

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
                <button
                  type="button"
                  class="flex min-w-0 grow cursor-pointer items-center gap-2 px-3 py-2 text-left after:absolute after:inset-0 after:cursor-pointer"
                  :aria-label="`${SPECIES_WIZARD_LABELS.pickAria}: ${row.name}`"
                  @click.left.exact.prevent="handleSpeciesRowClick(row.url)"
                >
                  <UIcon
                    v-if="row.hasLineages"
                    name="tabler:chevron-right"
                    class="size-4 shrink-0 text-muted transition-transform"
                    :class="row.chevronClass"
                  />

                  <span
                    v-else
                    class="size-4 shrink-0"
                  />

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

                <UTooltip :text="SPECIES_WIZARD_LABELS.preview">
                  <UButton
                    icon="tabler:layout-sidebar-right-expand"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    square
                    class="relative z-10 shrink-0"
                    :aria-label="`${SPECIES_WIZARD_LABELS.previewAria}: ${row.name}`"
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
                v-if="row.isExpanded || row.isLineagesLoading"
                class="ml-5 flex flex-col gap-1 border-l border-default/50 pl-2"
              >
                <span
                  v-if="row.isLineagesLoading"
                  class="flex items-center gap-2 px-3 py-1.5 text-xs text-muted"
                >
                  <UIcon
                    name="tabler:loader-2"
                    class="size-3.5 animate-spin"
                  />

                  {{ SPECIES_WIZARD_LABELS.lineagesLoading }}
                </span>

                <div
                  v-for="lineage in row.lineages"
                  :key="lineage.url"
                  class="relative flex items-center gap-1 rounded-md pr-2 transition-colors hover:bg-elevated/60"
                  :class="lineage.rowClass"
                >
                  <button
                    type="button"
                    class="flex min-w-0 grow cursor-pointer items-center px-3 py-1.5 text-left after:absolute after:inset-0 after:cursor-pointer"
                    :aria-label="`${SPECIES_WIZARD_LABELS.lineagePickAria}: ${lineage.name}`"
                    @click.left.exact.prevent="
                      handleLineageClick(row.url, lineage.url)
                    "
                  >
                    <span class="grow truncate text-sm text-toned">
                      {{ lineage.name }}
                    </span>
                  </button>

                  <UTooltip :text="SPECIES_WIZARD_LABELS.lineagePreview">
                    <UButton
                      icon="tabler:layout-sidebar-right-expand"
                      color="neutral"
                      variant="ghost"
                      size="xs"
                      square
                      class="relative z-10 shrink-0"
                      :aria-label="`${SPECIES_WIZARD_LABELS.lineagePreviewAria}: ${lineage.name}`"
                      @click.left.exact.prevent="handlePreview(lineage.url)"
                    />
                  </UTooltip>

                  <UIcon
                    v-if="lineage.isSelected"
                    name="tabler:check"
                    class="size-4 shrink-0 text-primary"
                  />
                </div>
              </div>
            </template>

            <span
              v-if="!displayRows.length"
              class="px-3 py-6 text-center text-sm text-dimmed"
            >
              {{ SPECIES_WIZARD_LABELS.empty }}
            </span>
          </div>

          <span class="text-xs text-muted">
            {{ SPECIES_WIZARD_LABELS.listHint }}
          </span>
        </template>

        <template v-else>
          <div class="flex flex-wrap items-center gap-2 text-sm">
            <span class="text-muted">
              {{ SPECIES_WIZARD_LABELS.resultPrefix }}
            </span>

            <span class="font-bold text-highlighted">{{ resultName }}</span>
          </div>

          <div
            v-if="showSizeChoice"
            class="flex flex-col gap-2"
          >
            <span
              class="text-[10px] font-bold tracking-wider text-muted uppercase"
            >
              {{ SPECIES_WIZARD_LABELS.size }}
            </span>

            <URadioGroup
              v-model="sizeChoice"
              :items="sizeOptions"
              orientation="horizontal"
              variant="list"
              color="primary"
            />
          </div>

          <div class="flex flex-col gap-2">
            <span
              class="text-[10px] font-bold tracking-wider text-muted uppercase"
            >
              {{ SPECIES_WIZARD_LABELS.features }}
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
                  {{ row.originLabel }}
                </UBadge>
              </div>

              <!-- Черту выбирают тем же полем, что в мастере класса: пул
              бывает под сотню записей, и описание каждой читают в окне -->
              <SheetFeatChoiceField
                v-for="choice in row.featChoices"
                :key="choice.id"
                :title="choice.label"
                :modal-subtitle="featureRowModalSubtitles[row.id]"
                :options="featOptions(choice)"
                :selected="selectedFeat(choice.id)"
                :abilities="featAbilities(choice.id)"
                :scores="character.abilities"
                :is-loading="isFeatsLoading"
                :has-error="hasFeatsError"
                @update:feat="setFeatChoice(row.id, choice.id, $event)"
                @update:ability="setFeatAbility(choice.id, $event)"
              />

              <SheetChoicePickerField
                v-for="control in featureRowControls[row.id]"
                :key="control.choice.id"
                :title="control.title"
                :explanation="control.explanation"
                :modal-title="control.modalTitle"
                :modal-subtitle="control.modalSubtitle"
                :options="control.options"
                :count="control.requiredCount"
                :status="control.status"
                :warning="SKILL_DUPLICATE_WARNING"
                :model-value="selections[control.choice.id] ?? []"
                @update:model-value="updateSelection(control.choice, $event)"
                @retry="handleSpellPoolRetry(control.choice)"
              />

              <!-- Свободная строка — умению, которое ни о чём не спрашивает:
              игрок записывает в неё свой выбор сам -->
              <UInput
                v-if="!row.choiceControls.length && !row.featChoices.length"
                v-model="choices[row.id]"
                size="sm"
                :placeholder="SPECIES_WIZARD_LABELS.featureChoicePlaceholder"
              />

              <MarkupRender
                :render-node="row.description"
                class="text-sm"
              />
            </div>

            <span
              v-if="!featureRows.length"
              class="text-xs text-dimmed italic"
            >
              {{ SPECIES_WIZARD_LABELS.featuresEmpty }}
            </span>
          </div>
        </template>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full flex-wrap items-center justify-between gap-2">
        <UButton
          v-if="step === 'features'"
          :label="ACTION_LABELS.back"
          icon="tabler:arrow-left"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="handleBack"
        />

        <UButton
          v-else
          :label="CUSTOM_SPECIES_LABELS.openButton"
          icon="tabler:plus"
          color="neutral"
          variant="subtle"
          @click.left.exact.prevent="handleCustomSpecies"
        />

        <div class="ml-auto flex gap-2">
          <UButton
            :label="ACTION_LABELS.cancel"
            color="neutral"
            variant="ghost"
            @click.left.exact.prevent="handleCancel"
          />

          <UButton
            v-if="step === 'features'"
            :label="ACTION_LABELS.apply"
            color="primary"
            :loading="isApplying"
            @click.left.exact.prevent="handleApply"
          />

          <UButton
            v-else
            :label="ACTION_LABELS.next"
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
