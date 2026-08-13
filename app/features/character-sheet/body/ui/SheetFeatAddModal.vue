<script setup lang="ts">
  import type { FeatCatalogItem, FeatSummary } from '../../model';

  import { FeatDrawer } from '~feats/drawer';

  import { useCatalogSourceQuery, useCharacterSheet } from '../../composables';
  import {
    buildFeatFeature,
    FEAT_SOURCES_ASYNC_DATA_KEY,
    FEATS_FILTERS_PATH,
    FEATS_SEARCH_PATH,
    FEATS_SELECT_PATH,
    fetchFeatDetail,
    getFeatUrlFromFeatureId,
    parseFeatCatalog,
    parseRepeatableFeatUrls,
    resolveChoiceOptions,
    SHEET_SEARCH_LABELS,
  } from '../../model';
  import SheetChoiceSelect from './SheetChoiceSelect.vue';
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

  /** Ответы игрока на выборы черт: id выбора → выбранные навыки. */
  const choiceAnswers = ref<Record<string, string[]>>({});

  /** Черты, которые о чём-то спрашивают, — по ним и строится шаг выбора. */
  const choiceRows = computed(() =>
    loadedSummaries.value.flatMap((summary) =>
      summary.choices.map((choice) => ({
        choice,
        featName: summary.name,
        options: resolveChoiceOptions(choice, {
          skillNames: character.value.skills.map((skill) => skill.name),
          proficientSkillNames: character.value.skills
            .filter((skill) => skill.proficiency !== 'none')
            .map((skill) => skill.name),
          // Выбор идёт по уже собранному листу, а не внутри мастера, поэтому
          // «выбранных прямо сейчас во владение» навыков здесь не бывает.
          chosenProficientSkills: [],
          knownLanguages: character.value.proficiencies.languages,
          knownTools: character.value.proficiencies.tools.map(
            (tool) => tool.name,
          ),
          // Пул компетентности резолвится владениями навыками, поэтому
          // справочники языков и инструментов ему не нужны.
          allLanguages: [],
          allTools: [],
        }),
      })),
    ),
  );

  const isChoiceStep = computed(() => choiceRows.value.length > 0);

  /** Все выборы отвечены — иначе применять рано. */
  const isChoiceComplete = computed(() =>
    choiceRows.value.every(
      (row) => (choiceAnswers.value[row.choice.id]?.length ?? 0) > 0,
    ),
  );

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
        expertiseSkills: summary.choices.flatMap(
          (choice) => choiceAnswers.value[choice.id] ?? [],
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
  }
</script>

<template>
  <UModal
    title="Добавление черт"
    :ui="{ content: 'sm:max-w-2xl' }"
  >
    <template #body>
      <!-- Второй шаг: черта о чём-то спрашивает. Пока это только навык для
        компетентности («Знаток») — остальные виды выбора лист не применяет и
        потому не показывает -->
      <div
        v-if="isChoiceStep"
        class="flex h-[65dvh] min-h-96 flex-col gap-4 overflow-y-auto pr-1"
      >
        <p class="text-sm text-dimmed">
          Черта даёт компетентность: бонус мастерства в выбранном навыке
          удваивается. Выбрать можно только навык, которым персонаж уже владеет.
        </p>

        <div
          v-for="row in choiceRows"
          :key="row.choice.id"
          class="flex flex-col gap-1"
        >
          <span class="text-sm font-medium text-highlighted">
            {{ row.featName }}
          </span>

          <SheetChoiceSelect
            v-model="choiceAnswers[row.choice.id]"
            :items="row.options"
            :count="row.choice.count"
            :placeholder="row.choice.label || 'Выберите навык'"
          />
        </div>

        <p
          v-if="!choiceRows.some((row) => row.options.length)"
          class="text-sm text-warning"
        >
          Персонаж пока не владеет ни одним навыком — компетентность дать не в
          чем. Выберите класс или предысторию, затем добавьте черту.
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
          Не удалось загрузить черты
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
                :aria-label="`Выбрать черту: ${feat.name}`"
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

              <UTooltip text="Открыть описание черты">
                <UButton
                  icon="tabler:layout-sidebar-right-expand"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  square
                  class="relative z-10 shrink-0"
                  :aria-label="`Описание черты: ${feat.name}`"
                  @click.left.exact.prevent="handlePreview(feat.url)"
                />
              </UTooltip>

              <UTooltip
                v-if="feat.repeatability"
                text="Можно взять несколько раз"
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
                text="Уже добавлена"
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
            Ничего не найдено
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
            label="Назад"
            color="neutral"
            variant="ghost"
            @click.left.exact.prevent="handleChoiceBack"
          />

          <UButton
            label="Применить"
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
            label="Отмена"
            color="neutral"
            variant="ghost"
            @click.left.exact.prevent="handleCancel"
          />

          <UButton
            label="Добавить"
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
