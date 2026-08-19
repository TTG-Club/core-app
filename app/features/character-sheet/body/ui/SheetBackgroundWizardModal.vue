<script setup lang="ts">
  import type {
    AbilityBonusMode,
    AbilityKey,
    BackgroundOption,
    BackgroundSummary,
    CharacterFeature,
    CharacterInventoryItem,
    CharacterSpell,
    ClassChoice,
    FeatSummary,
    SpellCatalogItem,
  } from '../../model';

  import { BackgroundDrawer } from '~backgrounds/drawer';
  import { FeatDrawer } from '~feats/drawer';
  import { MarkupRender } from '~ui/markup';

  import {
    useCatalogSourceQuery,
    useCharacterSheet,
    useToolCatalog,
  } from '../../composables';
  import {
    ABILITY_LABELS,
    ABILITY_ORDER,
    BACKGROUND_ABILITY_MODE_OPTIONS,
    BACKGROUNDS_DETAIL_BASE_PATH,
    BACKGROUNDS_FILTERS_PATH,
    BACKGROUNDS_SEARCH_PATH,
    buildFeatFeature,
    buildStartingEquipmentItems,
    CHOICE_SELECT_PLACEHOLDER,
    CLASSES_SEARCH_PATH,
    collectChosenProficiencies,
    computeAbilityBonuses,
    CUSTOM_BACKGROUND_LABELS,
    FEATS_DETAIL_BASE_PATH,
    fetchChoiceSpells,
    getChoiceSpellClassUrls,
    getFeatAbilityIncreases,
    getOwnedSkillHints,
    getRequiredChoiceCount,
    getToolNames,
    getVisibleFeatChoices,
    LANGUAGE_PROFICIENCY_GROUPS,
    ORIGIN_FEAT_ACQUISITION_LEVEL,
    parseBackgroundDetail,
    parseBackgroundOptions,
    parseClassOptions,
    parseFeatDetail,
    resolveChoiceOptions,
    SHEET_SEARCH_LABELS,
    STARTING_EQUIPMENT_SKIP_VALUE,
  } from '../../model';
  import SheetChoiceSelect from './SheetChoiceSelect.vue';
  import SheetCustomBackgroundModal from './SheetCustomBackgroundModal.vue';
  import SheetSearchInput from './SheetSearchInput.vue';
  import SheetStartingEquipmentChoice from './SheetStartingEquipmentChoice.vue';

  type WizardStep = 'background' | 'review';

  const emit = defineEmits<{
    close: [];
  }>();

  const toast = useToast();

  const overlay = useOverlay();

  const { character, setBackground } = useCharacterSheet();

  // Дроверы описаний с сайта; без destroyOnClose — повторный open() после
  // закрытия иначе падает («Overlay not found»).
  const backgroundPreviewDrawer = overlay.create(BackgroundDrawer, {
    props: {
      url: '',
      onClose: () => backgroundPreviewDrawer.close(),
    },
  });

  const featPreviewDrawer = overlay.create(FeatDrawer, {
    props: {
      url: '',
      onClose: () => featPreviewDrawer.close(),
    },
  });

  // Своя предыстория собирается в отдельной модалке поверх списка: сама она и
  // применяет её к листу, поэтому мастер после успеха только закрывается, а
  // отмена возвращает к списку каталога.
  const customBackgroundModal = overlay.create(SheetCustomBackgroundModal);

  function handlePreview(url: string) {
    backgroundPreviewDrawer.open({ url });
  }

  async function handleCustomBackground() {
    const isCreated = await customBackgroundModal.open();

    if (isCreated) {
      emit('close');
    }
  }

  function handleFeatPreview(url: string) {
    featPreviewDrawer.open({ url });
  }

  const step = ref<WizardStep>('background');

  const skillNames = computed(() =>
    character.value.skills.map((skill) => skill.name),
  );

  /** Навыки, которыми персонаж уже владеет: из них выбирается компетентность. */
  const proficientSkillNames = computed<string[]>(() =>
    character.value.skills
      .filter((skill) => skill.proficiency !== 'none')
      .map((skill) => skill.name),
  );

  const allLanguages = computed(() =>
    LANGUAGE_PROFICIENCY_GROUPS.flatMap((group) => group.items),
  );

  // Каталог инструментов грузится фоном: выбор инструмента появляется только на
  // втором шаге, а модалка не должна ждать ещё один запрос при открытии.
  const {
    getToolNamesForGroups,
    resolveTools,
    load: loadToolCatalog,
  } = useToolCatalog();

  void loadToolCatalog();

  // Источники берутся из глобальной настройки профиля — визард не показывает
  // предыстории из отключённых книг. Запрос ждём до списка: иначе первая выдача
  // пришла бы по всем источникам и мигнула лишними строками.
  const { sourceQuery } = await useCatalogSourceQuery(
    'character-sheet:background-sources',
    BACKGROUNDS_FILTERS_PATH,
  );

  // Полный список предысторий загружается сразу при открытии визарда.
  const { data: backgroundList, status: listStatus } = await useAsyncData(
    'character-sheet:background-list',
    async () => {
      const response = await $fetch<unknown>(BACKGROUNDS_SEARCH_PATH, {
        method: 'GET',
        query: { ...sourceQuery.value },
        retry: 0,
      });

      return parseBackgroundOptions(response);
    },
    { server: false },
  );

  const isListLoading = computed(() => listStatus.value === 'pending');

  const searchTerm = ref('');

  const selectedOption = ref<BackgroundOption | undefined>();

  const backgroundDetail = ref<BackgroundSummary | null>(null);

  /**
   * Деталь черты предыстории. Черта может о чём-то спрашивать, и спросить нужно
   * здесь же: на листе она появляется вместе с предысторией, и второго случая
   * задать вопрос не будет.
   */
  const featSummary = ref<FeatSummary | null>(null);

  const isStepLoading = ref(false);

  const isApplying = ref(false);

  /** Черновик выбора инструмента (id `background-tool`). */
  const selections = ref<Record<string, string[]>>({});

  /** Метка выбранного варианта стартового снаряжения (или «не добавлять»). */
  const startingEquipmentLabel = ref(STARTING_EQUIPMENT_SKIP_VALUE);

  const abilityMode = ref<AbilityBonusMode>('2-1');

  const plusTwoAbility = ref<AbilityKey | undefined>();

  const plusOneAbility = ref<AbilityKey | undefined>();

  const filteredOptions = computed(() => {
    const query = searchTerm.value.trim().toLowerCase();

    const list = backgroundList.value ?? [];

    if (!query) {
      return list;
    }

    return list.filter((option) => option.name.toLowerCase().includes(query));
  });

  const displayRows = computed(() =>
    filteredOptions.value.map((option) => {
      const isSelected = selectedOption.value?.url === option.url;

      return {
        ...option,
        isSelected,
        rowClass: isSelected ? 'bg-elevated' : '',
      };
    }),
  );

  const startingEquipmentOptions = computed(
    () => backgroundDetail.value?.startingEquipment ?? [],
  );

  const selectedStartingEquipmentOption = computed(() =>
    startingEquipmentOptions.value.find(
      (option) => option.label === startingEquipmentLabel.value,
    ),
  );

  const abilityItems = computed(() =>
    (backgroundDetail.value?.abilities ?? []).map((key) => ({
      label: ABILITY_LABELS[key],
      value: key,
    })),
  );

  /**
   * Навыки предыстории с пометкой уже имеющихся: предыстория выдаёт их без
   * выбора, поэтому вместо запрета показывается сама пометка — по правилам 2024
   * повторное владение просто ничего не даёт.
   */
  const backgroundSkillRows = computed<
    Array<{ name: string; label: string; color: 'neutral' | 'primary' }>
  >(() => {
    const hints = getOwnedSkillHints(character.value.skills);

    return (backgroundDetail.value?.skills ?? []).map((name) => {
      const hint = hints[name];

      return {
        name,
        label: hint ? `${name} · ${hint}` : name,
        color: hint ? 'neutral' : 'primary',
      };
    });
  });

  /**
   * Одну характеристику нельзя усилить дважды (+3): выбранная под +1
   * недоступна для +2 и наоборот.
   */
  const plusTwoAbilityItems = computed(() =>
    abilityItems.value.map((option) => ({
      ...option,
      disabled: option.value === plusOneAbility.value,
    })),
  );

  const plusOneAbilityItems = computed(() =>
    abilityItems.value.map((option) => ({
      ...option,
      disabled: option.value === plusTwoAbility.value,
    })),
  );

  const abilityBonuses = computed(() =>
    computeAbilityBonuses(
      backgroundDetail.value?.abilities ?? [],
      abilityMode.value,
      plusTwoAbility.value ?? null,
      plusOneAbility.value ?? null,
    ),
  );

  const bonusRows = computed(() =>
    ABILITY_ORDER.filter((key) => (abilityBonuses.value[key] ?? 0) > 0).map(
      (key) => ({
        key,
        label: ABILITY_LABELS[key],
        bonus: `+${abilityBonuses.value[key] ?? 0}`,
      }),
    ),
  );

  const isAbilityChoiceValid = computed(() => {
    if (abilityMode.value === '1-1-1') {
      return true;
    }

    return Boolean(
      plusTwoAbility.value
      && plusOneAbility.value
      && plusTwoAbility.value !== plusOneAbility.value,
    );
  });

  const isNextDisabled = computed(() => !selectedOption.value);

  /** Выборы черты предыстории: у «Мудреца» их задаёт «Посвящённый в магию». */
  const featChoices = computed<ClassChoice[]>(() =>
    getVisibleFeatChoices(featSummary.value?.choices ?? [], selections.value),
  );

  /** Все выборы черты отвечены сполна — иначе применять рано. */
  const isFeatChoiceComplete = computed<boolean>(() =>
    featChoices.value.every(
      (choice) =>
        (selections.value[choice.id]?.length ?? 0) >= choiceCount(choice),
    ),
  );

  const isApplyDisabled = computed(
    () =>
      !backgroundDetail.value
      || !isAbilityChoiceValid.value
      || !isFeatChoiceComplete.value,
  );

  /**
   * Классы каталога для сверки названия с предысторией: «Мудрец» называет класс
   * черты словом («Волшебник»), а фильтр поиска заклинаний принимает ссылку.
   * Списка классов в самой механике черты для этого мало — селект редактора
   * пишет туда только ссылки.
   */
  const { data: classOptions } = await useAsyncData(
    'character-sheet:background-feat-classes',
    async () => {
      const response = await $fetch<unknown>(CLASSES_SEARCH_PATH, {
        method: 'GET',
        retry: 0,
      });

      return parseClassOptions(response, true);
    },
    { server: false, default: () => [] },
  );

  /**
   * Ссылка класса, названного предысторией; null — предыстория класс не
   * называет или такого класса в каталоге нет.
   */
  const featClassUrl = computed<string | null>(() => {
    const subchoice = backgroundDetail.value?.featSubchoice?.trim();

    if (!subchoice) {
      return null;
    }

    const named = (classOptions.value ?? []).find(
      (option) => option.name === subchoice,
    );

    return named?.url ?? null;
  });

  /** Пул заклинаний по id выбора: собирается поиском по каталогу. */
  const spellPools = ref<Record<string, SpellCatalogItem[]>>({});

  function choiceOptions(choice: ClassChoice): string[] {
    if (choice.kind === 'spell') {
      return (spellPools.value[choice.id] ?? []).map((spell) => spell.name);
    }

    return resolveChoiceOptions(choice, {
      skillNames: skillNames.value,
      proficientSkillNames: proficientSkillNames.value,
      // Навыки самой предыстории тоже считаются владением: они лягут на лист
      // вместе с чертой, и компетентность в них выбрать можно.
      chosenProficientSkills: backgroundDetail.value?.skills ?? [],
      knownLanguages: character.value.proficiencies.languages,
      knownTools: getToolNames(character.value.proficiencies.tools),
      allLanguages: allLanguages.value,
      // Опции выбора инструмента — из каталога сайта, сузженные до групп,
      // названных в прозе («один вид игрового набора»).
      allTools: getToolNamesForGroups(choice.toolGroups),
    });
  }

  /** Требуемое число опций: не больше, чем доступно в списке выбора. */
  function choiceCount(choice: ClassChoice): number {
    return getRequiredChoiceCount(choice, choiceOptions(choice));
  }

  function updateSelection(choice: ClassChoice, values: string[]): void {
    selections.value = {
      ...selections.value,
      [choice.id]: values.slice(0, choiceCount(choice)),
    };
  }

  /**
   * Классы, из списков которых идёт выбор. Предыстория может назвать класс сама
   * («Мудрец» даёт «Посвящённого в магию» со списком волшебника) — тогда пул
   * сужается до него, потому что по правилам список один, а не объединение.
   *
   * @param choice выбор заклинания.
   * @returns url классов для фильтра поиска.
   */
  function getChoiceClassUrls(choice: ClassChoice): string[] {
    // Ответ игрока на выбор списка заклинаний сужает пул сам: если черта на
    // него ссылается, класс берётся оттуда, а не из перечисления фильтра.
    const urls = getChoiceSpellClassUrls(
      choice,
      featSummary.value?.choices ?? [],
      selections.value,
    );

    // Класс, названный предысторией, сужает пул: по правилам список один, а не
    // объединение перечисленных в черте. Если черта его не перечисляет, класс
    // предыстории всё равно задаёт пул — она и определяет, чей это список.
    const named = featClassUrl.value;

    if (named && (!urls.length || urls.includes(named))) {
      return [named];
    }

    return urls;
  }

  /**
   * Ответы, от которых зависят пулы: если черта спрашивает список заклинаний,
   * пул её заклинаний собирается уже по названному классу.
   */
  const spellPoolAnswersKey = computed(() =>
    featChoices.value
      .filter((choice) => choice.kind === 'spell-list')
      .map((choice) => (selections.value[choice.id] ?? []).join(','))
      .join('|'),
  );

  // Цикла нет: ключ считается только по ответам на выбор списка, а обработчик
  // чистит ответы выбора заклинания — значение ключа от этого не меняется.
  watch(spellPoolAnswersKey, () => {
    // Пул сменился — прежде выбранные заклинания к нему уже не относятся.
    for (const choice of featChoices.value) {
      if (choice.kind === 'spell') {
        selections.value = { ...selections.value, [choice.id]: [] };
      }
    }

    void loadSpellPools();
  });

  /** Загружает пулы заклинаний для всех выборов черты разом. */
  async function loadSpellPools(): Promise<void> {
    const spellChoices = featChoices.value.flatMap((choice) =>
      choice.kind === 'spell' && choice.spellFilter
        ? [{ choice, filter: choice.spellFilter }]
        : [],
    );

    const pools = await Promise.all(
      spellChoices.map(async ({ choice, filter }) => ({
        id: choice.id,
        spells: await fetchChoiceSpells(filter, getChoiceClassUrls(choice)),
      })),
    );

    spellPools.value = Object.fromEntries(
      pools.map((pool) => [pool.id, pool.spells]),
    );
  }

  /**
   * Заклинания, выбранные игроком: пул хранит записи справочника, а пикер —
   * названия, поэтому выбранное сверяется по названию.
   *
   * @returns выбранные заклинания записями листа.
   */
  function collectChosenSpells(): CharacterSpell[] {
    return featChoices.value.flatMap((choice) => {
      const chosen = new Set(selections.value[choice.id] ?? []);

      return (
        (spellPools.value[choice.id] ?? [])
          .filter((spell) => chosen.has(spell.name))
          // Заклинание черты подготовлено сразу и места среди подготовленных не
          // занимает — как врождённое заклинание вида.
          .map((spell) => ({ ...spell, prepared: true }))
      );
    });
  }

  /**
   * Ответы игрока на выборы черты по ключу выбора: id пикера — это
   * `feat:<url>:<ключ>`, а в записи ответы лежат под самим ключом, потому что у
   * повторяемой черты id записи получает ещё и уникальный суффикс.
   *
   * @returns ответы по ключу выбора.
   */
  function collectFeatChoiceAnswers(): Record<string, string[]> {
    const answers: Record<string, string[]> = {};

    for (const choice of featChoices.value) {
      // Выборы повышения характеристик заведены самим листом: ключа выбора в
      // механике у них нет, а ответ уходит в прибавки к характеристикам.
      if (
        choice.kind === 'ability-score'
        || choice.kind === 'ability-variant'
      ) {
        continue;
      }

      const values = selections.value[choice.id] ?? [];
      const key = choice.id.split(':').at(-1) ?? '';

      if (key && values.length) {
        answers[key] = values;
      }
    }

    return answers;
  }

  function showLoadError() {
    toast.add({
      color: 'error',
      icon: 'tabler:alert-triangle',
      title: 'Не удалось загрузить данные предыстории',
    });
  }

  function handleBackgroundSelect(backgroundUrl: string) {
    selectedOption.value = (backgroundList.value ?? []).find(
      (option) => option.url === backgroundUrl,
    );
  }

  async function fetchBackgroundDetail(
    url: string,
  ): Promise<BackgroundSummary | null> {
    const response = await $fetch<unknown>(
      `${BACKGROUNDS_DETAIL_BASE_PATH}/${url}`,
      { method: 'GET', retry: 0 },
    );

    return parseBackgroundDetail(response, skillNames.value);
  }

  async function fetchFeatDetail(url: string) {
    const response = await $fetch<unknown>(`${FEATS_DETAIL_BASE_PATH}/${url}`, {
      method: 'GET',
      retry: 0,
    });

    return parseFeatDetail(response);
  }

  async function handleNext() {
    const option = selectedOption.value;

    if (!option || isStepLoading.value || isNextDisabled.value) {
      return;
    }

    isStepLoading.value = true;

    try {
      backgroundDetail.value = await fetchBackgroundDetail(option.url);

      if (!backgroundDetail.value) {
        showLoadError();

        return;
      }

      featSummary.value = backgroundDetail.value.featUrl
        ? await fetchFeatDetail(backgroundDetail.value.featUrl)
        : null;

      // Пул заклинаний зависит от загруженной черты, поэтому грузится следом.
      await loadSpellPools();

      selections.value = {};
      abilityMode.value = '2-1';
      plusTwoAbility.value = undefined;
      plusOneAbility.value = undefined;

      // Первый вариант снаряжения предлагается по умолчанию: лист чаще всего
      // заполняется на создании персонажа, где набор предыстории нужен целиком.
      startingEquipmentLabel.value =
        backgroundDetail.value.startingEquipment[0]?.label
        ?? STARTING_EQUIPMENT_SKIP_VALUE;

      step.value = 'review';
    } catch (error) {
      consola.error('Ошибка загрузки предыстории:', error);
      showLoadError();
    } finally {
      isStepLoading.value = false;
    }
  }

  function handleBack() {
    step.value = 'background';
  }

  async function handleApply() {
    const detail = backgroundDetail.value;

    if (!detail || isApplying.value || !isAbilityChoiceValid.value) {
      return;
    }

    isApplying.value = true;

    try {
      // Предметы выбранного варианта снаряжения догружаются до применения; их
      // неудачные запросы гасятся внутри, поэтому шаг не бросает.
      const startingEquipmentOption = selectedStartingEquipmentOption.value;

      const startingEquipmentItems: CharacterInventoryItem[] =
        startingEquipmentOption
          ? await buildStartingEquipmentItems(startingEquipmentOption)
          : [];

      let featFeature: CharacterFeature | null = null;

      // Деталь черты уже загружена на переходе к обзору: там же игрок ответил
      // на её выборы, и повторный запрос вернул бы то же самое.
      const summary = featSummary.value;

      if (summary) {
        // Черта происхождения даётся на первом уровне (правило 2024) — от него и
        // считается прибавка «Крепкого» к максимуму хитов.
        const feature = buildFeatFeature(summary, {
          level: ORIGIN_FEAT_ACQUISITION_LEVEL,
          // Владения применяются сразу — они ложатся в снимок владений черты;
          // остальные ответы лист хранит в записи черты и применит позже.
          proficiencies: collectChosenProficiencies(
            featChoices.value,
            selections.value,
            // Навыки самой предыстории тоже считаются владением: они лягут на
            // лист вместе с чертой.
            [...proficientSkillNames.value, ...(detail.skills ?? [])],
          ),
          choiceAnswers: collectFeatChoiceAnswers(),
          spells: collectChosenSpells(),
          abilityIncreases: getFeatAbilityIncreases(
            summary,
            character.value.abilities,
            selections.value,
          ),
        });

        featFeature = detail.featSubchoice
          ? { ...feature, choice: detail.featSubchoice }
          : feature;
      }

      setBackground({
        background: { url: detail.url, name: detail.name },
        abilityBonuses: computeAbilityBonuses(
          detail.abilities,
          abilityMode.value,
          plusTwoAbility.value ?? null,
          plusOneAbility.value ?? null,
        ),
        skills: detail.skills,
        // И фиксированные владения предыстории, и выбранные игроком сверяются с
        // каталогом сайта: ненайденное станет своим инструментом без ссылки.
        tools: resolveTools([
          ...detail.toolFixed,
          ...(selections.value['background-tool'] ?? []).map((name) => ({
            name,
            url: null,
          })),
        ]),
        featUrl: detail.featUrl,
        featFeature,
        // Снаряжение применяется вместе с предысторией: лист сам снимет набор
        // прошлого выбора, поэтому её смена не копит предметы и монеты.
        startingEquipment: startingEquipmentOption
          ? {
              items: startingEquipmentItems,
              coins: startingEquipmentOption.coins,
              coinKey: startingEquipmentOption.coinKey,
            }
          : null,
      });

      emit('close');
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
    title="Выбор предыстории"
    :ui="{ content: 'sm:max-w-2xl' }"
  >
    <template #body>
      <div class="flex min-h-48 flex-col gap-4">
        <template v-if="step === 'background'">
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
            <div
              v-for="row in displayRows"
              :key="row.url"
              class="relative flex items-center gap-1 rounded-md pr-2 transition-colors hover:bg-elevated/60"
              :class="row.rowClass"
            >
              <button
                type="button"
                class="flex min-w-0 grow cursor-pointer items-center gap-2 px-3 py-2 text-left after:absolute after:inset-0 after:cursor-pointer"
                :aria-label="`Выбрать предысторию: ${row.name}`"
                @click.left.exact.prevent="handleBackgroundSelect(row.url)"
              >
                <span
                  class="grow truncate text-sm font-medium text-highlighted"
                >
                  {{ row.name }}
                </span>

                <!-- Черта — то, чем предыстории отличаются друг от друга, и
                  видеть её нужно до выбора, а не на следующем шаге -->
                <span
                  v-if="row.featName"
                  class="hidden shrink-0 truncate text-xs text-muted sm:block"
                >
                  {{ row.featName }}
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

              <UTooltip text="Открыть описание предыстории">
                <UButton
                  icon="tabler:layout-sidebar-right-expand"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  square
                  class="relative z-10 shrink-0"
                  :aria-label="`Описание предыстории: ${row.name}`"
                  @click.left.exact.prevent="handlePreview(row.url)"
                />
              </UTooltip>

              <UIcon
                v-if="row.isSelected"
                name="tabler:check"
                class="size-4 shrink-0 text-primary"
              />
            </div>

            <span
              v-if="!displayRows.length"
              class="px-3 py-6 text-center text-sm text-dimmed"
            >
              Ничего не найдено
            </span>
          </div>

          <span class="text-xs text-muted">
            При применении навыки, инструмент, черта происхождения, прибавки к
            характеристикам и выбранный вариант стартового снаряжения сразу
            заполнят лист.
          </span>
        </template>

        <template v-else-if="backgroundDetail">
          <div class="flex flex-wrap items-center gap-2 text-sm">
            <span class="text-muted">Предыстория:</span>

            <span class="font-bold text-highlighted">
              {{ backgroundDetail.name }}
            </span>
          </div>

          <div class="flex flex-col gap-1">
            <span
              class="text-[10px] font-bold tracking-wider text-muted uppercase"
            >
              Навыки (будут добавлены)
            </span>

            <div class="flex flex-wrap gap-1">
              <UBadge
                v-for="skill in backgroundSkillRows"
                :key="skill.name"
                size="sm"
                :color="skill.color"
                variant="subtle"
              >
                {{ skill.label }}
              </UBadge>

              <span
                v-if="!backgroundDetail.skills.length"
                class="text-sm text-dimmed italic"
              >
                {{ backgroundDetail.skillsText || 'не распознаны' }}
              </span>
            </div>
          </div>

          <div class="flex flex-col gap-1">
            <span
              class="text-[10px] font-bold tracking-wider text-muted uppercase"
            >
              Инструмент
            </span>

            <SheetChoiceSelect
              v-if="backgroundDetail.toolChoice"
              :model-value="selections['background-tool'] ?? []"
              :items="choiceOptions(backgroundDetail.toolChoice)"
              :count="choiceCount(backgroundDetail.toolChoice)"
              :placeholder="`${CHOICE_SELECT_PLACEHOLDER} ${choiceCount(backgroundDetail.toolChoice)}`"
              @update:model-value="
                updateSelection(backgroundDetail.toolChoice, $event)
              "
            />

            <div
              v-else
              class="flex flex-wrap gap-1"
            >
              <UBadge
                v-for="tool in backgroundDetail.toolFixed"
                :key="tool.name"
                size="sm"
                color="neutral"
                variant="subtle"
              >
                {{ tool.name }}
              </UBadge>

              <span
                v-if="!backgroundDetail.toolFixed.length"
                class="text-sm text-dimmed italic"
              >
                нет
              </span>
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <span
              class="text-[10px] font-bold tracking-wider text-muted uppercase"
            >
              Характеристики ({{ backgroundDetail.abilitiesText }})
            </span>

            <URadioGroup
              v-model="abilityMode"
              :items="BACKGROUND_ABILITY_MODE_OPTIONS"
              orientation="horizontal"
              variant="list"
              color="primary"
            />

            <div
              v-if="abilityMode === '2-1'"
              class="flex flex-wrap gap-3"
            >
              <div class="flex flex-col gap-1">
                <span class="text-xs text-muted">+2 к характеристике</span>

                <USelect
                  v-model="plusTwoAbility"
                  :items="plusTwoAbilityItems"
                  placeholder="Характеристика"
                  class="w-44"
                />
              </div>

              <div class="flex flex-col gap-1">
                <span class="text-xs text-muted">+1 к характеристике</span>

                <USelect
                  v-model="plusOneAbility"
                  :items="plusOneAbilityItems"
                  placeholder="Характеристика"
                  class="w-44"
                />
              </div>
            </div>

            <div class="flex flex-wrap gap-1">
              <UBadge
                v-for="row in bonusRows"
                :key="row.key"
                size="sm"
                color="primary"
                variant="subtle"
              >
                {{ row.label }} {{ row.bonus }}
              </UBadge>
            </div>
          </div>

          <div
            v-if="backgroundDetail.featUrl"
            class="flex flex-col gap-1"
          >
            <span
              class="text-[10px] font-bold tracking-wider text-muted uppercase"
            >
              Черта (будет добавлена)
            </span>

            <div class="flex items-center gap-2">
              <span class="text-sm font-medium text-highlighted">
                {{ backgroundDetail.featName }}
                <span
                  v-if="backgroundDetail.featSubchoice"
                  class="text-muted"
                >
                  ({{ backgroundDetail.featSubchoice }})
                </span>
              </span>

              <UTooltip text="Открыть описание черты">
                <UButton
                  icon="tabler:layout-sidebar-right-expand"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  square
                  aria-label="Описание черты"
                  @click.left.exact.prevent="
                    handleFeatPreview(backgroundDetail.featUrl)
                  "
                />
              </UTooltip>
            </div>

            <!-- Черта может о чём-то спрашивать: ответить нужно здесь, на лист
              она попадёт вместе с предысторией -->
            <div
              v-for="choice in featChoices"
              :key="choice.id"
              class="flex flex-col gap-1"
            >
              <span class="text-sm text-toned">{{ choice.label }}</span>

              <SheetChoiceSelect
                :model-value="selections[choice.id] ?? []"
                :items="choiceOptions(choice)"
                :count="choiceCount(choice)"
                :placeholder="`${CHOICE_SELECT_PLACEHOLDER} ${choiceCount(choice)}`"
                @update:model-value="updateSelection(choice, $event)"
              />
            </div>
          </div>

          <SheetStartingEquipmentChoice
            v-if="startingEquipmentOptions.length"
            v-model="startingEquipmentLabel"
            :options="startingEquipmentOptions"
          />

          <div
            v-if="backgroundDetail.equipment.length"
            class="flex flex-col gap-1"
          >
            <span
              class="text-[10px] font-bold tracking-wider text-muted uppercase"
            >
              Снаряжение (справка)
            </span>

            <MarkupRender
              :render-node="backgroundDetail.equipment"
              class="text-sm text-toned"
            />
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
          :label="CUSTOM_BACKGROUND_LABELS.openButton"
          icon="tabler:plus"
          color="neutral"
          variant="subtle"
          @click.left.exact.prevent="handleCustomBackground"
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
