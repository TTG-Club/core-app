<script setup lang="ts">
  import type { ClassChoice, SpeciesOption, SpeciesSummary } from '../../model';

  import { SpeciesDrawer } from '~species/drawer';
  import { MarkupRender } from '~ui/markup';

  import { useCharacterSheet } from '../../composables';
  import {
    buildCharacterFeatures,
    detectFeatureChoice,
    FEATURE_ORIGIN_LABELS,
    getCharacterFeatureId,
    getDarkvisionDistance,
    LANGUAGE_PROFICIENCY_GROUPS,
    parseSizeOptionsFromText,
    parseSpeciesDetail,
    parseSpeciesLineages,
    parseSpeciesOptions,
    parseSpeedFromText,
    resolveChoiceOptions,
    SPECIES_DETAIL_BASE_PATH,
    SPECIES_SEARCH_PATH,
    TOOL_PROFICIENCY_GROUPS,
  } from '../../model';
  import SheetChoiceSelect from './SheetChoiceSelect.vue';

  type WizardStep = 'species' | 'features';

  const emit = defineEmits<{
    close: [];
  }>();

  const toast = useToast();

  const overlay = useOverlay();

  const { character, setSpecies } = useCharacterSheet();

  // Дровер описания вида с сайта; без destroyOnClose — повторный open()
  // после закрытия иначе падает («Overlay not found»).
  const speciesPreviewDrawer = overlay.create(SpeciesDrawer, {
    props: {
      url: '',
      onClose: () => speciesPreviewDrawer.close(),
    },
  });

  function handlePreview(url: string) {
    speciesPreviewDrawer.open({ url });
  }

  const step = ref<WizardStep>('species');

  // Полный список видов загружается сразу при открытии визарда.
  const { data: speciesList, status: listStatus } = await useAsyncData(
    'character-sheet:species-list',
    async () => {
      const response = await $fetch<unknown>(SPECIES_SEARCH_PATH, {
        method: 'GET',
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

  const sizeChoice = ref<string | undefined>();

  const choices = ref<Record<string, string>>({});

  /** Черновик выборов-селекторов по id выбора: id → выбранные значения. */
  const selections = ref<Record<string, string[]>>({});

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

  const featureRows = computed(() => {
    const rows: Array<{
      id: string;
      name: string;
      description: string[];
      originLabel: string;
      choiceControl: ClassChoice | null;
    }> = [];

    const detail = speciesDetail.value;

    if (detail) {
      for (const feature of detail.features) {
        const id = getCharacterFeatureId('species', feature.url);

        rows.push({
          id,
          name: feature.name,
          description: feature.description,
          originLabel: `${FEATURE_ORIGIN_LABELS.species}: ${detail.name}`,
          choiceControl: detectFeatureChoice(
            id,
            feature.description,
            skillNames.value,
          ),
        });
      }
    }

    const lineage = selectedLineage.value;

    if (lineage) {
      for (const feature of lineage.features) {
        const id = getCharacterFeatureId('lineage', feature.url);

        rows.push({
          id,
          name: feature.name,
          description: feature.description,
          originLabel: `${FEATURE_ORIGIN_LABELS.lineage}: ${lineage.name}`,
          choiceControl: detectFeatureChoice(
            id,
            feature.description,
            skillNames.value,
          ),
        });
      }
    }

    return rows;
  });

  const chosenProficientSkills = computed(() =>
    featureRows.value
      .filter((row) => row.choiceControl?.kind === 'skill-proficiency')
      .flatMap((row) => selections.value[row.id] ?? []),
  );

  /** Опции пикера выбора в зависимости от его типа. */
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

  /** Обновление выбора с ограничением по требуемому количеству. */
  function updateSelection(choice: ClassChoice, values: string[]): void {
    selections.value = {
      ...selections.value,
      [choice.id]: values.slice(0, choice.count),
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
      sizeChoice.value = sizeOptions.value[0];
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

  function handleApply() {
    const detail = speciesDetail.value;

    if (!detail) {
      return;
    }

    const lineage = selectedLineage.value;

    const allFeatureSummaries = [
      ...detail.features,
      ...(lineage?.features ?? []),
    ];

    // Сбор выборов-селекторов: навыки (владение/экспертиза) и языки; выбранные
    // значения также идут в текст особенности, чтобы отображаться на листе.
    const proficientSkills: string[] = [];
    const expertiseSkills: string[] = [];
    const chosenLanguages: string[] = [];
    const featureChoices: Record<string, string> = { ...choices.value };

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
      } else {
        chosenLanguages.push(...values);
      }

      featureChoices[control.id] = values.join(', ');
    }

    setSpecies({
      species: {
        url: detail.url,
        name: detail.name,
        lineageUrl: lineage?.url ?? null,
        lineageName: lineage?.name ?? null,
      },
      size: sizeChoice.value ?? null,
      speed: parseSpeedFromText(effectiveSpeedText.value),
      vision: {
        normal: character.value.vision.normal,
        darkvision: getDarkvisionDistance(allFeatureSummaries),
        unit: 'feet',
      },
      features: buildCharacterFeatures(detail, lineage, featureChoices),
      skills: {
        proficient: [...new Set(proficientSkills)],
        expertise: [...new Set(expertiseSkills)],
      },
      proficiencies: {
        languages: [...new Set(chosenLanguages)],
      },
    });

    emit('close');
  }

  function handleCancel() {
    emit('close');
  }
</script>

<template>
  <UModal
    title="Выбор вида"
    :ui="{ content: 'sm:max-w-2xl' }"
  >
    <template #body>
      <div class="flex min-h-48 flex-col gap-4">
        <template v-if="step === 'species'">
          <UInput
            v-model="searchTerm"
            icon="tabler:search"
            placeholder="Поиск по названию…"
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
                  :aria-label="`Выбрать вид: ${row.name}`"
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

                <UTooltip text="Открыть описание вида">
                  <UButton
                    icon="tabler:layout-sidebar-right-expand"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    square
                    class="relative z-10 shrink-0"
                    :aria-label="`Описание вида: ${row.name}`"
                    @click.left.exact.prevent="handlePreview(row.url)"
                  />
                </UTooltip>

                <UIcon
                  v-if="row.isSelected"
                  name="tabler:check"
                  class="size-4 shrink-0 text-warning"
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

                  Загрузка подвидов…
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
                    :aria-label="`Выбрать подвид: ${lineage.name}`"
                    @click.left.exact.prevent="
                      handleLineageClick(row.url, lineage.url)
                    "
                  >
                    <span class="grow truncate text-sm text-toned">
                      {{ lineage.name }}
                    </span>
                  </button>

                  <UTooltip text="Открыть описание подвида">
                    <UButton
                      icon="tabler:layout-sidebar-right-expand"
                      color="neutral"
                      variant="ghost"
                      size="xs"
                      square
                      class="relative z-10 shrink-0"
                      :aria-label="`Описание подвида: ${lineage.name}`"
                      @click.left.exact.prevent="handlePreview(lineage.url)"
                    />
                  </UTooltip>

                  <UIcon
                    v-if="lineage.isSelected"
                    name="tabler:check"
                    class="size-4 shrink-0 text-warning"
                  />
                </div>
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
            Вид с подвидами разворачивается стрелкой — выберите конкретный
            подвид. При применении скорость, зрение, размер и особенности сразу
            заполнят лист.
          </span>
        </template>

        <template v-else>
          <div class="flex flex-wrap items-center gap-2 text-sm">
            <span class="text-muted">Вид:</span>

            <span class="font-bold text-highlighted">{{ resultName }}</span>
          </div>

          <div
            v-if="showSizeChoice"
            class="flex flex-col gap-2"
          >
            <span
              class="text-[10px] font-bold tracking-wider text-muted uppercase"
            >
              Размер
            </span>

            <URadioGroup
              v-model="sizeChoice"
              :items="sizeOptions"
              orientation="horizontal"
              variant="list"
              color="warning"
            />
          </div>

          <div class="flex flex-col gap-2">
            <span
              class="text-[10px] font-bold tracking-wider text-muted uppercase"
            >
              Особенности
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

              <div
                v-if="row.choiceControl"
                class="flex flex-col gap-1"
              >
                <span class="text-xs text-muted">
                  Выберите {{ row.choiceControl.count }}
                </span>

                <SheetChoiceSelect
                  :model-value="selections[row.choiceControl.id] ?? []"
                  :items="choiceOptions(row.choiceControl)"
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
                placeholder="Ваш выбор в особенности (необязательно)"
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
              У вида нет описанных особенностей
            </span>
          </div>
        </template>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full items-center justify-between gap-2">
        <UButton
          v-if="step === 'features'"
          label="Назад"
          icon="tabler:arrow-left"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="handleBack"
        />

        <span v-else />

        <div class="flex gap-2">
          <UButton
            label="Отмена"
            color="neutral"
            variant="ghost"
            @click.left.exact.prevent="handleCancel"
          />

          <UButton
            v-if="step === 'features'"
            label="Применить"
            color="primary"
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
