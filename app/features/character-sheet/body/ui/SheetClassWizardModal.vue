<script setup lang="ts">
  import type {
    CharacterFeature,
    CharacterInventoryItem,
    ClassChoice,
    ClassOption,
    ClassSummary,
  } from '../../model';

  import { ClassDrawer } from '~classes/drawer';
  import { MarkupRender } from '~ui/markup';
  import { SelectFeat } from '~ui/select';

  import {
    useCatalogSourceQuery,
    useCharacterSheet,
    useToolCatalog,
  } from '../../composables';
  import {
    ABILITY_LABELS,
    buildClassFeatures,
    buildFeatFeature,
    buildStartingEquipmentItems,
    CLASS_SOURCES_ASYNC_DATA_KEY,
    CLASSES_DETAIL_BASE_PATH,
    CLASSES_FILTERS_PATH,
    CLASSES_SEARCH_PATH,
    CUSTOM_CLASS_LABELS,
    deriveCantripsScaling,
    deriveClassResources,
    derivePreparedSpellsScaling,
    detectFeatureChoice,
    FEAT_SOURCES_ASYNC_DATA_KEY,
    FEATS_FILTERS_PATH,
    FEATURE_ORIGIN_LABELS,
    fetchFeatDetail,
    FIGHTING_STYLE_CHOICE_LABEL,
    FIGHTING_STYLE_FEAT_CATEGORIES,
    FIGHTING_STYLE_FEATURE_ID_SEGMENT,
    FIGHTING_STYLE_INVALID_RESPONSE_ERROR,
    getCharacterFeatureId,
    getChoiceSkillHints,
    getClassMaxHitPoints,
    getClassSkillChoice,
    getClassToolChoice,
    getSelectedCasterType,
    getToolNames,
    LANGUAGE_PROFICIENCY_GROUPS,
    matchClassProficiencies,
    matchToolProficiencies,
    parseClassDetail,
    parseClassOptions,
    resolveChoiceOptions,
    SHEET_SEARCH_LABELS,
    SKILL_DUPLICATE_WARNING,
    STARTING_EQUIPMENT_SKIP_VALUE,
    SUBCLASS_SELECTION_MIN_LEVEL,
    unionToolProficiencies,
  } from '../../model';
  import SheetChoiceSelect from './SheetChoiceSelect.vue';
  import SheetCustomClassModal from './SheetCustomClassModal.vue';
  import SheetSearchInput from './SheetSearchInput.vue';
  import SheetStartingEquipmentChoice from './SheetStartingEquipmentChoice.vue';

  type WizardStep = 'class' | 'review';

  /** Загруженная черта боевого стиля и умение класса, к которому она выбрана. */
  interface FightingStyleSelection {
    /** Идентификатор строки умения класса (`class:{featureKey}`). */
    rowId: string;

    /** Название черты — идёт в подпись выбора у самого умения. */
    featName: string;

    /** Готовая запись особенности для листа. */
    feature: CharacterFeature;
  }

  const emit = defineEmits<{
    close: [];
  }>();

  const toast = useToast();

  const overlay = useOverlay();

  const { character, setClass } = useCharacterSheet();

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

  const level = computed(() => character.value.level);

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

  /** Выбранные черты боевого стиля по id классового умения. */
  const fightingStyleSelections = ref<Record<string, string>>({});

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

    const list = classList.value ?? [];

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
  const maxHitPointsPreview = computed(() =>
    classDetail.value
      ? getClassMaxHitPoints(
          classDetail.value.hitDie,
          level.value,
          getModifier(character.value.abilities.constitution),
        )
      : 0,
  );

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
      [...classDetail.value.table, ...(subclassDetail.value?.table ?? [])],
      level.value,
    );
  });

  // Стартовое снаряжение даёт только базовый класс: у подкласса своего набора
  // нет.
  const startingEquipmentOptions = computed(
    () => classDetail.value?.startingEquipment ?? [],
  );

  const selectedStartingEquipmentOption = computed(() =>
    startingEquipmentOptions.value.find(
      (option) => option.label === startingEquipmentLabel.value,
    ),
  );

  // Выборы уровня класса (владение навыками/инструментами) из прозы владений.
  const classChoices = computed<ClassChoice[]>(() => {
    const base = classDetail.value;

    if (!base) {
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
    });
  }

  /** Пометки опций: навыки, которыми персонаж уже владеет. */
  function choiceHints(choice: ClassChoice): Record<string, string> {
    return getChoiceSkillHints(choice, character.value.skills);
  }

  /** Обновление выбора с ограничением по требуемому количеству. */
  function updateSelection(choice: ClassChoice, values: string[]): void {
    selections.value = {
      ...selections.value,
      [choice.id]: values.slice(0, choice.count),
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
      choiceControl: ClassChoice | null;
      fightingStyleChoice: boolean;
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

        const id = getCharacterFeatureId('class', feature.key);

        rows.push({
          id,
          name: feature.name,
          level: feature.level,
          description: feature.description,
          originLabel,
          fightingStyleChoice: feature.fightingStyleChoice,
          choiceControl: detectFeatureChoice(
            id,
            feature.description,
            skillNames.value,
          ),
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

  const isNextDisabled = computed(() => !selectedClass.value);

  const isApplyDisabled = computed(
    () =>
      isApplying.value
      || featureRows.value.some(
        (row) =>
          row.fightingStyleChoice && !fightingStyleSelections.value[row.id],
      ),
  );

  function showLoadError() {
    toast.add({
      color: 'error',
      icon: 'tabler:alert-triangle',
      title: 'Не удалось загрузить данные класса',
    });
  }

  function showFightingStyleError() {
    toast.add({
      color: 'error',
      icon: 'tabler:alert-triangle',
      title: 'Не удалось добавить выбранный боевой стиль',
    });
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
      fightingStyleSelections.value = {};

      // Первый вариант снаряжения предлагается по умолчанию: лист чаще всего
      // заполняется на создании персонажа, где набор класса нужен целиком.
      startingEquipmentLabel.value =
        classDetail.value.startingEquipment[0]?.label
        ?? STARTING_EQUIPMENT_SKIP_VALUE;

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
   * Загружает выбранные черты боевого стиля и делает их классовыми записями,
   * чтобы смена класса удаляла прежний выбор. Строки без выбора пропускаются:
   * применение до полного выбора блокирует `isApplyDisabled`.
   */
  function buildFightingStyleFeatures(): Promise<
    Array<FightingStyleSelection>
  > {
    const selectedRows: Array<{ rowId: string; featUrl: string }> = [];

    for (const row of featureRows.value) {
      const featUrl = fightingStyleSelections.value[row.id];

      if (row.fightingStyleChoice && featUrl) {
        selectedRows.push({ rowId: row.id, featUrl });
      }
    }

    return Promise.all(
      selectedRows.map(async ({ rowId, featUrl }) => {
        const summary = await fetchFeatDetail(featUrl);

        if (!summary) {
          throw new Error(FIGHTING_STYLE_INVALID_RESPONSE_ERROR);
        }

        return {
          rowId,
          featName: summary.name,
          feature: {
            ...buildFeatFeature(summary),
            id: `${rowId}:${FIGHTING_STYLE_FEATURE_ID_SEGMENT}:${summary.url}`,
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
    let fightingStyleFeatures: Array<FightingStyleSelection>;

    try {
      fightingStyleFeatures = await buildFightingStyleFeatures();
    } catch (error) {
      consola.error('Ошибка добавления боевого стиля:', error);

      showFightingStyleError();

      return;
    }

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
      ? (selections.value['class-skills'] ?? []).slice(0, skillsChoice.count)
      : [];

    const chosenTools = selections.value['class-tools'] ?? [];

    // Выборы внутри умений: владение навыком, экспертиза и языки; выбранные
    // значения также идут в текст умения, чтобы отображаться на листе.
    const expertiseSkills: string[] = [];
    const chosenLanguages: string[] = [];
    const featureChoices: Record<string, string> = { ...choices.value };

    for (const selection of fightingStyleFeatures) {
      featureChoices[selection.rowId] = selection.featName;
    }

    for (const row of featureRows.value) {
      const control = row.choiceControl;

      if (!control) {
        continue;
      }

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

    setClass({
      characterClass: {
        url: base.url,
        name: base.name,
        subclassUrl: selectedSubclass.value?.url ?? null,
        subclassName: subclassDetail.value?.name ?? null,
        casterType: getSelectedCasterType(base, subclassDetail.value),
        hitDie: base.hitDie,
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
      },
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
        languages: chosenLanguages,
      },
      skills: {
        proficient: [...new Set(proficientSkills)],
        expertise: [...new Set(expertiseSkills)],
      },
      classResources: derivedResources.value,
      features: [
        ...buildClassFeatures(
          base,
          subclassDetail.value,
          level.value,
          featureChoices,
        ),
        ...fightingStyleFeatures.map((selection) => selection.feature),
      ],
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
    title="Выбор класса"
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

          <span class="text-xs text-muted">
            Класс с подклассами разворачивается стрелкой — подкласс
            необязателен. При применении кость хитов, хиты, спасброски,
            владения, ресурсы, умения по текущему уровню и выбранный вариант
            стартового снаряжения сразу заполнят лист.
          </span>
        </template>

        <template v-else>
          <div class="flex flex-wrap items-center gap-2 text-sm">
            <span class="text-muted">Класс:</span>

            <span class="font-bold text-highlighted">{{ resultName }}</span>
          </div>

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

            <div class="flex flex-col gap-1">
              <span
                class="text-[10px] font-bold tracking-wider text-muted uppercase"
              >
                Спасброски
              </span>

              <div class="flex flex-wrap gap-1">
                <UBadge
                  v-for="label in savingThrowLabels"
                  :key="label"
                  size="sm"
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

          <div
            v-if="proficiencyChips.length"
            class="flex flex-col gap-1"
          >
            <span
              class="text-[10px] font-bold tracking-wider text-muted uppercase"
            >
              Владения (распознаны, проверьте вручную)
            </span>

            <div class="flex flex-wrap gap-1">
              <UBadge
                v-for="chip in proficiencyChips"
                :key="chip"
                size="sm"
                color="neutral"
                variant="subtle"
              >
                {{ chip }}
              </UBadge>
            </div>
          </div>

          <div
            v-if="classChoices.length"
            class="flex flex-col gap-3"
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
                {{ choice.label }} (выберите {{ choice.count }})
              </span>

              <SheetChoiceSelect
                :model-value="selections[choice.id] ?? []"
                :items="choiceOptions(choice)"
                :hints="choiceHints(choice)"
                :warning="SKILL_DUPLICATE_WARNING"
                :count="choice.count"
                :placeholder="`Выберите ${choice.count}`"
                @update:model-value="updateSelection(choice, $event)"
              />
            </div>
          </div>

          <SheetStartingEquipmentChoice
            v-if="startingEquipmentOptions.length"
            v-model="startingEquipmentLabel"
            :options="startingEquipmentOptions"
          />

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

              <div
                v-if="row.fightingStyleChoice"
                class="flex flex-col gap-1"
              >
                <span class="text-xs text-muted">
                  {{ FIGHTING_STYLE_CHOICE_LABEL }}
                </span>

                <SelectFeat
                  v-model="fightingStyleSelections[row.id]"
                  :categories="FIGHTING_STYLE_FEAT_CATEGORIES"
                  :sources="featSourceIds"
                />
              </div>

              <div
                v-else-if="row.choiceControl"
                class="flex flex-col gap-1"
              >
                <span class="text-xs text-muted">
                  Выберите {{ row.choiceControl.count }}
                </span>

                <SheetChoiceSelect
                  :model-value="selections[row.choiceControl.id] ?? []"
                  :items="choiceOptions(row.choiceControl)"
                  :hints="choiceHints(row.choiceControl)"
                  :warning="SKILL_DUPLICATE_WARNING"
                  :count="row.choiceControl.count"
                  :placeholder="`Выберите ${row.choiceControl.count}`"
                  @update:model-value="
                    updateSelection(row.choiceControl, $event)
                  "
                />
              </div>

              <UInput
                v-else
                v-model="choices[row.id]"
                size="sm"
                placeholder="Ваш выбор в умении (необязательно)"
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
              Нет умений до текущего уровня
            </span>
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
