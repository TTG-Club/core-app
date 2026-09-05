<script setup lang="ts">
  import type {
    ClassChoice,
    FeatCatalogItem,
    FeatSummary,
    GrantedProficiencies,
    SheetChoiceControl,
  } from '../../model';

  import { ACTION_LABELS } from '~/shared/consts';
  import { FeatDrawer } from '~feats/drawer';

  import {
    useCatalogSourceQuery,
    useCharacterSheet,
    useChoiceHints,
    useChoiceSpellPools,
    useToolCatalog,
  } from '../../composables';
  import {
    ABILITY_LABELS,
    buildChoiceControl,
    buildFeatFeature,
    CLASSES_SEARCH_PATH,
    collectChosenProficiencies,
    FEAT_SOURCES_ASYNC_DATA_KEY,
    FEATS_FILTERS_PATH,
    FEATS_SEARCH_PATH,
    FEATS_SELECT_PATH,
    FEATURE_ORIGIN_LABELS,
    fetchFeatDetail,
    getFeatAbilityIncreases,
    getFeatSpellcastingAbility,
    getFeatUrlFromFeatureId,
    getOwnedWeaponNames,
    getVisibleFeatChoices,
    LANGUAGE_PROFICIENCY_GROUPS,
    parseClassOptions,
    parseFeatCatalog,
    parseRepeatableFeatUrls,
    resolveChoiceOptions,
    SHEET_FEAT_MODAL_LABELS,
    SHEET_SEARCH_LABELS,
    withSpellListClassNames,
  } from '../../model';
  import SheetChoicePickerField from './SheetChoicePickerField.vue';
  import SheetSearchInput from './SheetSearchInput.vue';

  const emit = defineEmits<{
    close: [];
  }>();

  const toast = useToast();

  const overlay = useOverlay();

  const { character, addFeats } = useCharacterSheet();

  // Дровер описания черты с сайта; без destroyOnClose — повторный open()
  // после закрытия иначе падает («Overlay not found»).
  const featPreviewDrawer = overlay.create(FeatDrawer, {
    props: {
      url: '',
      onClose: () => featPreviewDrawer.close(),
    },
  });

  function handlePreview(url: string) {
    featPreviewDrawer.open({ url });
  }

  // Источники берутся из глобальной настройки профиля — модалка не показывает
  // черты из отключённых книг. Запрос ждём до списка: иначе первая выдача
  // пришла бы по всем источникам и мигнула лишними строками.
  const { sourceQuery } = await useCatalogSourceQuery(
    FEAT_SOURCES_ASYNC_DATA_KEY,
    FEATS_FILTERS_PATH,
  );

  // Весь список черт грузится сразу при открытии (раздел «Черты» отдаёт его
  // одним запросом без пагинации), фильтрация по названию — на клиенте. Флаг
  // повторяемости приходит только с `/select` (у `/search` его нет), поэтому
  // тянем оба и мёржим по url. Ошибка `/select` не роняет список — тогда
  // повторяемых черт просто нет. Список источников ограничивает `/search`:
  // `/select` нужен лишь ради флага, лишние url в нём безвредны.
  const { data: featsList, status: listStatus } = await useAsyncData(
    'character-sheet:feats-list',
    async () => {
      const [catalogResponse, selectResponse] = await Promise.all([
        $fetch<unknown>(FEATS_SEARCH_PATH, {
          method: 'GET',
          query: { ...sourceQuery.value },
          retry: 0,
        }),
        $fetch<unknown>(FEATS_SELECT_PATH, { method: 'GET', retry: 0 }).catch(
          () => null,
        ),
      ]);

      return parseFeatCatalog(
        catalogResponse,
        parseRepeatableFeatUrls(selectResponse),
      );
    },
    { server: false },
  );

  const isListLoading = computed(() => listStatus.value === 'pending');

  const isListError = computed(() => listStatus.value === 'error');

  const searchTerm = ref('');

  /** Черновик выбора: url новых, ещё не добавленных черт. */
  const draftUrls = ref(new Set<string>());

  const isApplying = ref(false);

  /** Сколько копий каждой черты уже на листе (по url черты). */
  const featInstanceCounts = computed(() => {
    const counts = new Map<string, number>();

    for (const feature of character.value.features) {
      const url = getFeatUrlFromFeatureId(feature.id);

      if (url) {
        counts.set(url, (counts.get(url) ?? 0) + 1);
      }
    }

    return counts;
  });

  /** Url черт, которые можно брать несколько раз. */
  const repeatableUrls = computed(
    () =>
      new Set(
        (featsList.value ?? [])
          .filter((feat) => feat.repeatability)
          .map((feat) => feat.url),
      ),
  );

  /**
   * Фильтрация каталога по подстроке русского или английского названия.
   *
   * @param catalogFeats черты каталога.
   * @param query поисковый запрос в нижнем регистре.
   * @returns черты, чьё название содержит запрос.
   */
  function filterFeatsByName(
    catalogFeats: FeatCatalogItem[],
    query: string,
  ): FeatCatalogItem[] {
    return catalogFeats.filter(
      (feat) =>
        feat.name.toLowerCase().includes(query)
        || feat.nameEng.toLowerCase().includes(query),
    );
  }

  const filteredFeats = computed<FeatCatalogItem[]>(() => {
    const query = searchTerm.value.trim().toLowerCase();

    const list = featsList.value ?? [];

    if (!query) {
      return list;
    }

    return withLayoutFallback(query, (searchQuery) =>
      filterFeatsByName(list, searchQuery),
    );
  });

  interface FeatCatalogRow extends FeatCatalogItem {
    /** Черта уже на листе и добавить её повторно нельзя (неповторяемая). */
    isAdded: boolean;

    /** Сколько копий черты уже на листе (для повторяемых). */
    addedCount: number;

    isSelected: boolean;
    rowClass: string;

    /** Класс курсора кнопки выбора: у добавленной черты выбор недоступен. */
    cursorClass: string;
  }

  interface FeatCatalogGroup {
    category: string;
    feats: FeatCatalogRow[];
  }

  // Группировка по категории (как в разделе «Черты»): категории и черты внутри
  // сортируются по алфавиту. Неповторяемая уже добавленная черта помечается и
  // недоступна для выбора; повторяемую можно взять снова (со счётчиком копий).
  const displayGroups = computed<FeatCatalogGroup[]>(() => {
    const groupsByCategory = new Map<string, FeatCatalogRow[]>();

    for (const feat of filteredFeats.value) {
      const addedCount = featInstanceCounts.value.get(feat.url) ?? 0;

      const isAdded = !feat.repeatability && addedCount > 0;

      const isSelected = draftUrls.value.has(feat.url);

      const row: FeatCatalogRow = {
        ...feat,
        isAdded,
        addedCount,
        isSelected,
        rowClass: isSelected ? 'bg-elevated' : '',
        cursorClass: isAdded
          ? 'cursor-default'
          : 'cursor-pointer after:cursor-pointer',
      };

      const existingGroup = groupsByCategory.get(feat.category);

      if (existingGroup) {
        existingGroup.push(row);
      } else {
        groupsByCategory.set(feat.category, [row]);
      }
    }

    return [...groupsByCategory.entries()]
      .map(([category, feats]) => ({
        category,
        feats: feats.sort((left, right) =>
          left.name.localeCompare(right.name, 'ru'),
        ),
      }))
      .sort((left, right) => left.category.localeCompare(right.category, 'ru'));
  });

  const selectedCountLabel = computed(() => `Выбрано: ${draftUrls.value.size}`);

  const isApplyDisabled = computed(
    () => !draftUrls.value.size || isApplying.value,
  );

  function toggleFeat(feat: FeatCatalogRow) {
    if (feat.isAdded) {
      return;
    }

    const nextUrls = new Set(draftUrls.value);

    if (nextUrls.has(feat.url)) {
      nextUrls.delete(feat.url);
    } else {
      nextUrls.add(feat.url);
    }

    draftUrls.value = nextUrls;
  }

  /** Загруженные детали выбранных черт — их же применяет второй шаг. */
  const loadedSummaries = ref<FeatSummary[]>([]);

  /** Ответы игрока на выборы черт: id выбора → выбранные значения. */
  const choiceAnswers = ref<Record<string, string[]>>({});

  // Пул заклинаний собирается по названному игроком списку класса: предыстории,
  // которая назвала бы его сама, здесь нет
  const {
    pools: spellPools,
    getPool: getSpellPool,
    getSpellOptions,
    getStatus: getSpellPoolStatus,
    collectChosenSpells,
    load: loadSpellPools,
    retry: retrySpellPool,
  } = useChoiceSpellPools({
    sources: () => loadedSummaries.value,
    answers: choiceAnswers,
  });

  // Каталог инструментов грузится фоном: выбор инструмента появляется только на
  // втором шаге, а список черт не должен ждать ещё один запрос при открытии.
  const {
    getToolNamesForGroups,
    catalogItems: toolCatalogItems,
    load: loadToolCatalog,
  } = useToolCatalog();

  void loadToolCatalog();

  /**
   * Опции пикера выбора. Пул заклинаний приходит поиском по каталогу, а не из
   * механики черты, поэтому берётся из загруженного пула, а не резолвится.
   *
   * @param choice выбор черты.
   * @returns опции пикера.
   */
  function choiceOptions(choice: ClassChoice): string[] {
    if (choice.kind === 'spell') {
      return getSpellOptions(choice);
    }

    return resolveChoiceOptions(choice, {
      skillNames: character.value.skills.map((skill) => skill.name),
      proficientSkillNames: character.value.skills
        .filter((skill) => skill.proficiency !== 'none')
        .map((skill) => skill.name),
      // Выбор идёт по уже собранному листу, а не внутри мастера, поэтому
      // «выбранных прямо сейчас во владение» навыков здесь не бывает.
      chosenProficientSkills: [],
      knownLanguages: character.value.proficiencies.languages,
      knownTools: character.value.proficiencies.tools.map((tool) => tool.name),
      allLanguages: LANGUAGE_PROFICIENCY_GROUPS.flatMap((group) => group.items),
      // Инструмент черта называет группой словами («три музыкальных
      // инструмента»), а не ссылками, поэтому пул — весь каталог: сузить его
      // листу нечем, а подпись выбора игроку это и говорит.
      allTools: getToolNamesForGroups(choice.toolGroups),
      // Пул оружейного приёма — оружие во владении: приём даётся только
      // знакомому оружию.
      ownedWeaponNames: getOwnedWeaponNames(character.value),
      proficientSavingThrowNames: character.value.savingThrows
        .filter((savingThrow) => savingThrow.proficient)
        .map((savingThrow) => ABILITY_LABELS[savingThrow.key]),
    });
  }

  /**
   * Пометки опций: заклинания, которые персонаж уже знает. Черта спрашивает
   * заклинания и не по одному разу («Посвящённый в магию» просит два заговора
   * и заклинание первого круга), поэтому взятое соседним выбором тоже видно.
   */
  const { getHints: choiceHints } = useChoiceHints({
    choices: () => loadedSummaries.value.flatMap((summary) => summary.choices),
    selections: choiceAnswers,
  });

  /**
   * Классы каталога: в механике черты списки заклинаний перечислены ссылками, а
   * снимка названия у них может не быть — тогда игрок увидел бы слаг. Ключ
   * общий с визардом предыстории, поэтому запрос на оба окна один.
   */
  const { data: classOptions } = await useAsyncData(
    'character-sheet:feat-spell-list-classes',
    async () => {
      const response = await $fetch<unknown>(CLASSES_SEARCH_PATH, {
        method: 'GET',
        retry: 0,
      });

      return parseClassOptions(response, true);
    },
    { server: false, default: () => [] },
  );

  /** Строка выбора черты: сам выбор и его вид для единого пикера. */
  interface ChoiceRow {
    choice: ClassChoice;
    featName: string;
    options: string[];
    control: SheetChoiceControl;
  }

  /** Выборы одной черты: её название стоит над ними один раз. */
  interface ChoiceGroup {
    featName: string;
    rows: ChoiceRow[];
  }

  /** Черты, которые о чём-то спрашивают, — по ним и строится шаг выбора. */
  const choiceRows = computed<ChoiceRow[]>(() =>
    loadedSummaries.value.flatMap((summary) =>
      getVisibleFeatChoices(summary.choices, choiceAnswers.value)
        .map((choice) => withSpellListClassNames(choice, classOptions.value))
        .map((choice) => {
          const options = choiceOptions(choice);

          return {
            choice,
            featName: summary.name,
            options,
            control: buildChoiceControl(choice, {
              names: options,
              hints: choiceHints(choice),
              spellPool: getSpellPool(choice),
              status:
                choice.kind === 'spell' ? getSpellPoolStatus(choice) : 'ready',
              toolEntries: toolCatalogItems.value,
              origin: {
                featureName: summary.name,
                originLabel: FEATURE_ORIGIN_LABELS.feat,
                level: null,
              },
            }),
          };
        }),
    ),
  );

  /** Пул заклинаний выбора не загрузился — запросить его заново. */
  function handleSpellPoolRetry(choice: ClassChoice): void {
    void retrySpellPool(choice);
  }

  /**
   * Выборы, сгруппированные по черте: название черты стоит над её выборами
   * один раз, а не повторяется у каждого пикера — «Посвящённый в магию»
   * спрашивает три вещи подряд.
   */
  const choiceGroups = computed(() => {
    const byFeat = new Map<string, ChoiceGroup>();

    for (const row of choiceRows.value) {
      const group = byFeat.get(row.featName);

      if (group) {
        group.rows.push(row);
      } else {
        byFeat.set(row.featName, { featName: row.featName, rows: [row] });
      }
    }

    return [...byFeat.values()];
  });

  const isChoiceStep = computed(() => choiceRows.value.length > 0);

  /** Есть ли из чего выбирать хоть в одном пикере. */
  const hasChoiceOptions = computed<boolean>(() =>
    choiceRows.value.some((row) => row.options.length > 0),
  );

  /**
   * Все выборы отвечены сполна — иначе применять рано. Требуемое число берётся
   * с оглядкой на длину пула: черта могла попросить два навыка, а во владении у
   * персонажа только один, и тогда шаг иначе было бы не пройти.
   */
  const isChoiceComplete = computed<boolean>(() =>
    choiceRows.value.every(
      (row) =>
        (choiceAnswers.value[row.choice.id]?.length ?? 0)
        >= row.control.requiredCount,
    ),
  );

  /** Навыки, которыми персонаж уже владеет: по ним считается компетентность. */
  const proficientSkillNames = computed(() =>
    character.value.skills
      .filter((skill) => skill.proficiency !== 'none')
      .map((skill) => skill.name),
  );

  /**
   * Владения, выбранные игроком: навык, инструмент и язык. Применяются сразу —
   * ложатся в снимок владений черты, откуда их берёт журнал выдач.
   *
   * @param summary деталь черты.
   * @returns выбранные владения.
   */
  function collectProficiencies(
    summary: FeatSummary,
  ): Partial<GrantedProficiencies> {
    return collectChosenProficiencies(
      summary.choices,
      choiceAnswers.value,
      proficientSkillNames.value,
    );
  }

  /**
   * Ответы игрока на выборы черты по ключу выбора: id пикера — это
   * `feat:<url>:<ключ>`, а в записи ответы лежат под самим ключом, потому что у
   * повторяемой черты id записи получает ещё и уникальный суффикс.
   *
   * @param summary деталь черты.
   * @returns ответы по ключу выбора.
   */
  function collectChoiceAnswers(
    summary: FeatSummary,
  ): Record<string, string[]> {
    const answers: Record<string, string[]> = {};

    for (const choice of summary.choices) {
      // Выборы повышения характеристик лист заводит сам, ключа выбора в
      // механике у них нет — их ответ уходит в прибавки, а не в запись ответов.
      if (
        choice.kind === 'ability-score'
        || choice.kind === 'ability-variant'
      ) {
        continue;
      }

      const values = choiceAnswers.value[choice.id] ?? [];
      const key = choice.id.split(':').at(-1) ?? '';

      if (key && values.length) {
        answers[key] = values;
      }
    }

    return answers;
  }

  /**
   * Собирает записи умений из загруженных деталей с ответами игрока и добавляет
   * их на лист.
   */
  function applyLoadedFeats() {
    const features = loadedSummaries.value.map((summary) =>
      // Уровень взятия нужен прибавке к максимуму хитов: у «Крепкого» она
      // считается от него, а не от текущего уровня.
      buildFeatFeature(summary, {
        repeatable: repeatableUrls.value.has(summary.url),
        level: character.value.level,
        // Каждый вид ответа ложится в запись по-своему: компетентность — в
        // снимок владений, заклинание — в список записи, остальное лист хранит
        // ответом и применит позже. Свалить всё в компетентность нельзя —
        // выбранная характеристика ушла бы в журнал выдач навыком.
        proficiencies: collectProficiencies(summary),
        choiceAnswers: collectChoiceAnswers(summary),
        spells: collectChosenSpells(summary),
        // Названная игроком характеристика ложится на заклинания черты: от неё
        // считаются их атака и Сл спасброска
        spellcastingAbility: getFeatSpellcastingAbility(
          summary,
          choiceAnswers.value,
        ),
        abilityIncreases: getFeatAbilityIncreases(
          summary,
          character.value.abilities,
          choiceAnswers.value,
        ),
      }),
    );

    if (features.length) {
      addFeats(features);
    }

    emit('close');
  }

  async function handleApply() {
    const urls = [...draftUrls.value];

    if (!urls.length || isApplying.value) {
      return;
    }

    isApplying.value = true;

    try {
      const results = await Promise.allSettled(urls.map(fetchFeatDetail));

      loadedSummaries.value = results
        .map((result) => (result.status === 'fulfilled' ? result.value : null))
        .filter((summary): summary is FeatSummary => summary !== null);

      // Часть черт не загрузилась — сообщаем, но добавляем успешные.
      if (loadedSummaries.value.length < urls.length) {
        toast.add({
          color: 'error',
          icon: 'tabler:alert-triangle',
          title: 'Не удалось добавить часть черт',
        });
      }

      // Пулы заклинаний нужны шагу выбора: без них пикер «Посвящённого в магию»
      // открылся бы пустым.
      await loadSpellPools();

      // Черта может просить выбор («Знаток» — навык для компетентности): тогда
      // модалка не закрывается, а показывает второй шаг.
      if (!isChoiceStep.value) {
        applyLoadedFeats();
      }
    } finally {
      isApplying.value = false;
    }
  }

  function handleCancel() {
    emit('close');
  }

  /** Возврат к списку черт: ответы сбрасываются вместе с загруженными деталями. */
  function handleChoiceBack() {
    loadedSummaries.value = [];
    choiceAnswers.value = {};
    spellPools.value = {};
  }
</script>

<template>
  <UModal
    :title="SHEET_FEAT_MODAL_LABELS.title"
    :ui="{ content: 'sm:max-w-2xl' }"
  >
    <template #body>
      <!-- Второй шаг: черта о чём-то спрашивает — навык для компетентности
        («Знаток»), заклинательную характеристику и заклинания («Посвящённый в
        магию»). Виды выбора, которые лист не применяет, он и не показывает -->
      <div
        v-if="isChoiceStep"
        class="flex h-[65dvh] min-h-96 flex-col gap-4 overflow-y-auto pr-1"
      >
        <p class="text-sm text-dimmed">
          {{ SHEET_FEAT_MODAL_LABELS.choiceHint }}
        </p>

        <div
          v-for="group in choiceGroups"
          :key="group.featName"
          class="flex flex-col gap-3"
        >
          <span class="text-sm font-medium text-highlighted">
            {{ group.featName }}
          </span>

          <SheetChoicePickerField
            v-for="row in group.rows"
            :key="row.choice.id"
            v-model="choiceAnswers[row.choice.id]"
            :title="row.control.title"
            :explanation="row.control.explanation"
            :modal-title="row.control.modalTitle"
            :modal-subtitle="row.control.modalSubtitle"
            :options="row.control.options"
            :count="row.control.requiredCount"
            :status="row.control.status"
            :warning="row.control.warning"
            @retry="handleSpellPoolRetry(row.choice)"
          />
        </div>

        <p
          v-if="!hasChoiceOptions"
          class="text-sm text-warning"
        >
          {{ SHEET_FEAT_MODAL_LABELS.choiceEmptyOptions }}
        </p>
      </div>

      <div
        v-else
        class="flex h-[65dvh] min-h-96 flex-col gap-4"
      >
        <SheetSearchInput
          v-model="searchTerm"
          :placeholder="SHEET_SEARCH_LABELS.byNamePlaceholder"
          class="shrink-0"
        />

        <div
          v-if="isListLoading"
          class="flex grow items-center justify-center py-10"
        >
          <UIcon
            name="tabler:loader-2"
            class="size-6 animate-spin text-muted"
          />
        </div>

        <div
          v-else-if="isListError"
          class="flex grow items-center justify-center py-10 text-sm text-dimmed"
        >
          {{ SHEET_FEAT_MODAL_LABELS.listError }}
        </div>

        <div
          v-else
          class="flex min-h-0 grow flex-col gap-3 overflow-y-auto pr-1"
        >
          <div
            v-for="group in displayGroups"
            :key="group.category"
            class="flex flex-col gap-1"
          >
            <div class="flex items-center gap-2">
              <span
                class="shrink-0 text-[10px] font-bold tracking-wider text-muted uppercase"
              >
                {{ group.category }}
              </span>

              <div class="h-px grow bg-default/50" />
            </div>

            <div
              v-for="feat in group.feats"
              :key="feat.url"
              class="relative flex items-center gap-2 rounded-md pr-2 transition-colors hover:bg-elevated/60"
              :class="feat.rowClass"
            >
              <button
                type="button"
                class="flex min-w-0 grow items-center gap-2 px-3 py-1.5 text-left after:absolute after:inset-0"
                :class="feat.cursorClass"
                :disabled="feat.isAdded"
                :aria-label="`${SHEET_FEAT_MODAL_LABELS.pickAria}: ${feat.name}`"
                @click.left.exact.prevent="toggleFeat(feat)"
              >
                <span class="truncate text-sm font-medium text-highlighted">
                  {{ feat.name }}
                </span>

                <UBadge
                  v-if="feat.sourceLabel"
                  size="sm"
                  color="neutral"
                  variant="subtle"
                  class="relative z-10 shrink-0"
                >
                  {{ feat.sourceLabel }}
                </UBadge>
              </button>

              <UTooltip :text="SHEET_FEAT_MODAL_LABELS.descriptionTooltip">
                <UButton
                  icon="tabler:layout-sidebar-right-expand"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  square
                  class="relative z-10 shrink-0"
                  :aria-label="`${SHEET_FEAT_MODAL_LABELS.descriptionAria}: ${feat.name}`"
                  @click.left.exact.prevent="handlePreview(feat.url)"
                />
              </UTooltip>

              <UTooltip
                v-if="feat.repeatability"
                :text="SHEET_FEAT_MODAL_LABELS.repeatable"
              >
                <span
                  class="relative z-10 flex shrink-0 items-center gap-0.5 text-muted"
                >
                  <UIcon
                    name="tabler:repeat"
                    class="size-3.5"
                  />

                  <span
                    v-if="feat.addedCount"
                    class="text-xs tabular-nums"
                  >
                    ×{{ feat.addedCount }}
                  </span>
                </span>
              </UTooltip>

              <UTooltip
                v-else-if="feat.isAdded"
                :text="SHEET_FEAT_MODAL_LABELS.alreadyAdded"
              >
                <UIcon
                  name="tabler:check"
                  class="relative z-10 size-4 shrink-0 text-success"
                />
              </UTooltip>

              <UIcon
                v-if="feat.isSelected"
                name="tabler:check"
                class="relative z-10 size-4 shrink-0 text-primary"
              />
            </div>
          </div>

          <span
            v-if="!displayGroups.length"
            class="px-3 py-6 text-center text-sm text-dimmed"
          >
            {{ SHEET_FEAT_MODAL_LABELS.empty }}
          </span>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full items-center justify-between gap-2">
        <span class="text-sm text-muted">{{ selectedCountLabel }}</span>

        <div
          v-if="isChoiceStep"
          class="flex gap-2"
        >
          <UButton
            :label="ACTION_LABELS.back"
            color="neutral"
            variant="ghost"
            @click.left.exact.prevent="handleChoiceBack"
          />

          <UButton
            :label="ACTION_LABELS.apply"
            color="primary"
            :disabled="!isChoiceComplete"
            @click.left.exact.prevent="applyLoadedFeats"
          />
        </div>

        <div
          v-else
          class="flex gap-2"
        >
          <UButton
            :label="ACTION_LABELS.cancel"
            color="neutral"
            variant="ghost"
            @click.left.exact.prevent="handleCancel"
          />

          <UButton
            :label="ACTION_LABELS.add"
            color="primary"
            :loading="isApplying"
            :disabled="isApplyDisabled"
            @click.left.exact.prevent="handleApply"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
