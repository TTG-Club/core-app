<script setup lang="ts">
  import type { ClassChoice, ClassOption, ClassSummary } from '../../model';

  import { ClassDrawer } from '~classes/drawer';
  import { MarkupRender } from '~ui/markup';

  import { useCharacterSheet } from '../../composables';
  import {
    ABILITY_LABELS,
    buildClassFeatures,
    CLASSES_DETAIL_BASE_PATH,
    CLASSES_SEARCH_PATH,
    deriveClassResources,
    detectFeatureChoice,
    FEATURE_ORIGIN_LABELS,
    getCharacterFeatureId,
    getClassSkillChoice,
    getClassToolChoice,
    LANGUAGE_PROFICIENCY_GROUPS,
    matchClassProficiencies,
    parseClassDetail,
    parseClassOptions,
    SUBCLASS_SELECTION_MIN_LEVEL,
    TOOL_PROFICIENCY_GROUPS,
  } from '../../model';

  type WizardStep = 'class' | 'review';

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

  function handlePreview(url: string) {
    classPreviewDrawer.open({ url });
  }

  const step = ref<WizardStep>('class');

  const level = computed(() => character.value.level);

  // Полный список классов загружается сразу при открытии визарда.
  const { data: classList, status: listStatus } = await useAsyncData(
    'character-sheet:class-list',
    async () => {
      const response = await $fetch<unknown>(CLASSES_SEARCH_PATH, {
        method: 'GET',
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

  const allTools = computed(() =>
    TOOL_PROFICIENCY_GROUPS.flatMap((group) => group.items),
  );

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

  const savingThrowLabels = computed(() =>
    (classDetail.value?.savingThrows ?? []).map((key) => ABILITY_LABELS[key]),
  );

  const matchedProficiencies = computed(() =>
    classDetail.value
      ? matchClassProficiencies(classDetail.value.proficiencyText)
      : { armor: [], weapons: [], tools: [] },
  );

  const proficiencyChips = computed(() => [
    ...matchedProficiencies.value.armor,
    ...matchedProficiencies.value.weapons,
    ...matchedProficiencies.value.tools,
  ]);

  const derivedResources = computed(() =>
    classDetail.value
      ? deriveClassResources(classDetail.value.table, level.value)
      : [],
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
    if (choice.kind === 'skill-proficiency') {
      return choice.listed.length ? choice.listed : skillNames.value;
    }

    if (choice.kind === 'skill-expertise') {
      const chosen = selections.value['class-skills'] ?? [];

      return [...new Set([...proficientSkillNames.value, ...chosen])];
    }

    if (choice.kind === 'language') {
      const known = new Set(character.value.proficiencies.languages);

      return allLanguages.value.filter((name) => !known.has(name));
    }

    const knownTools = new Set(character.value.proficiencies.tools);
    const toolOptions = choice.listed.length ? choice.listed : allTools.value;

    return toolOptions.filter((name) => !knownTools.has(name));
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

        rows.push({
          id: getCharacterFeatureId('class', feature.key),
          name: feature.name,
          level: feature.level,
          description: feature.description,
          originLabel,
          choiceControl: detectFeatureChoice(feature),
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

  function showLoadError() {
    toast.add({
      color: 'error',
      icon: 'tabler:alert-triangle',
      title: 'Не удалось загрузить данные класса',
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

  function handleApply() {
    const base = classDetail.value;

    if (!base) {
      return;
    }

    const matched = matchClassProficiencies(base.proficiencyText);

    // Выбор владения навыками (уровень класса).
    const skillsChoice = classChoices.value.find(
      (choice) => choice.id === 'class-skills',
    );

    const proficientSkills = skillsChoice
      ? (selections.value['class-skills'] ?? []).slice(0, skillsChoice.count)
      : [];

    const chosenTools = selections.value['class-tools'] ?? [];

    // Выборы внутри умений: экспертиза и языки; выбранные значения также идут в
    // текст умения, чтобы отображаться на листе.
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

      if (control.kind === 'skill-expertise') {
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
        hitDie: base.hitDie,
      },
      savingThrows: base.savingThrows,
      hitDie: base.hitDie,
      proficiencies: {
        armor: matched.armor,
        weapons: matched.weapons,
        tools: [...matched.tools, ...chosenTools],
        languages: chosenLanguages,
      },
      skills: {
        proficient: proficientSkills,
        expertise: [...new Set(expertiseSkills)],
      },
      classResources: derivedResources.value,
      features: buildClassFeatures(
        base,
        subclassDetail.value,
        level.value,
        featureChoices,
      ),
    });

    emit('close');
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
                  class="size-4 shrink-0 text-warning"
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
                    class="size-4 shrink-0 text-warning"
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
            необязателен. При применении кость хитов, спасброски, владения,
            ресурсы и умения по текущему уровню сразу заполнят лист.
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
                Спасброски
              </span>

              <div class="flex flex-wrap gap-1">
                <UBadge
                  v-for="label in savingThrowLabels"
                  :key="label"
                  size="sm"
                  color="warning"
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
            v-if="derivedResources.length"
            class="flex flex-col gap-1"
          >
            <span
              class="text-[10px] font-bold tracking-wider text-muted uppercase"
            >
              Ресурсы (распознаны, редактируются на листе)
            </span>

            <div class="flex flex-wrap gap-1">
              <UBadge
                v-for="resource in derivedResources"
                :key="resource.id"
                size="sm"
                color="neutral"
                variant="subtle"
              >
                {{ resource.name }}: {{ resource.max }}
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

              <USelectMenu
                :model-value="selections[choice.id] ?? []"
                :items="choiceOptions(choice)"
                multiple
                searchable
                :placeholder="`Выберите ${choice.count}`"
                @update:model-value="updateSelection(choice, $event)"
              />
            </div>
          </div>

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
                v-if="row.choiceControl"
                class="flex flex-col gap-1"
              >
                <span class="text-xs text-muted">
                  Выберите {{ row.choiceControl.count }}
                </span>

                <USelectMenu
                  :model-value="selections[row.choiceControl.id] ?? []"
                  :items="choiceOptions(row.choiceControl)"
                  multiple
                  searchable
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
      <div class="flex w-full items-center justify-between gap-2">
        <UButton
          v-if="step === 'review'"
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
            v-if="step === 'review'"
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
