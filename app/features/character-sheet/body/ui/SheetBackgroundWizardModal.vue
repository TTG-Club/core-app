<script setup lang="ts">
  import type {
    AbilityBonusMode,
    AbilityKey,
    BackgroundOption,
    BackgroundSummary,
    CharacterFeature,
    ClassChoice,
  } from '../../model';

  import { BackgroundDrawer } from '~backgrounds/drawer';
  import { FeatDrawer } from '~feats/drawer';
  import { MarkupRender } from '~ui/markup';

  import { useCharacterSheet } from '../../composables';
  import {
    ABILITY_LABELS,
    ABILITY_ORDER,
    BACKGROUND_ABILITY_MODE_OPTIONS,
    BACKGROUNDS_DETAIL_BASE_PATH,
    BACKGROUNDS_SEARCH_PATH,
    buildFeatFeature,
    computeAbilityBonuses,
    FEATS_DETAIL_BASE_PATH,
    LANGUAGE_PROFICIENCY_GROUPS,
    parseBackgroundDetail,
    parseBackgroundOptions,
    parseFeatDetail,
    resolveChoiceOptions,
    TOOL_PROFICIENCY_GROUPS,
  } from '../../model';
  import SheetChoiceSelect from './SheetChoiceSelect.vue';

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

  function handlePreview(url: string) {
    backgroundPreviewDrawer.open({ url });
  }

  function handleFeatPreview(url: string) {
    featPreviewDrawer.open({ url });
  }

  const step = ref<WizardStep>('background');

  const skillNames = computed(() =>
    character.value.skills.map((skill) => skill.name),
  );

  const allLanguages = computed(() =>
    LANGUAGE_PROFICIENCY_GROUPS.flatMap((group) => group.items),
  );

  const allTools = computed(() =>
    TOOL_PROFICIENCY_GROUPS.flatMap((group) => group.items),
  );

  // Полный список предысторий загружается сразу при открытии визарда.
  const { data: backgroundList, status: listStatus } = await useAsyncData(
    'character-sheet:background-list',
    async () => {
      const response = await $fetch<unknown>(BACKGROUNDS_SEARCH_PATH, {
        method: 'GET',
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

  const isStepLoading = ref(false);

  const isApplying = ref(false);

  /** Черновик выбора инструмента (id `background-tool`). */
  const selections = ref<Record<string, string[]>>({});

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

  const abilityItems = computed(() =>
    (backgroundDetail.value?.abilities ?? []).map((key) => ({
      label: ABILITY_LABELS[key],
      value: key,
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

  const isApplyDisabled = computed(
    () => !backgroundDetail.value || !isAbilityChoiceValid.value,
  );

  function choiceOptions(choice: ClassChoice): string[] {
    return resolveChoiceOptions(choice, {
      skillNames: skillNames.value,
      proficientSkillNames: [],
      chosenProficientSkills: [],
      knownLanguages: character.value.proficiencies.languages,
      knownTools: character.value.proficiencies.tools,
      allLanguages: allLanguages.value,
      allTools: allTools.value,
    });
  }

  function updateSelection(choice: ClassChoice, values: string[]): void {
    selections.value = {
      ...selections.value,
      [choice.id]: values.slice(0, choice.count),
    };
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

      selections.value = {};
      abilityMode.value = '2-1';
      plusTwoAbility.value = undefined;
      plusOneAbility.value = undefined;
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
      let featFeature: CharacterFeature | null = null;

      if (detail.featUrl) {
        const summary = await fetchFeatDetail(detail.featUrl);

        if (summary) {
          const feature = buildFeatFeature(summary);

          featFeature = detail.featSubchoice
            ? { ...feature, choice: detail.featSubchoice }
            : feature;
        }
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
        tools: [
          ...detail.toolFixed,
          ...(selections.value['background-tool'] ?? []),
        ],
        featUrl: detail.featUrl,
        featFeature,
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
                class="size-4 shrink-0 text-warning"
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
            При применении навыки, инструмент, черта происхождения и прибавки к
            характеристикам сразу заполнят лист.
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
                v-for="skill in backgroundDetail.skills"
                :key="skill"
                size="sm"
                color="warning"
                variant="subtle"
              >
                {{ skill }}
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
              :count="backgroundDetail.toolChoice.count"
              :placeholder="`Выберите ${backgroundDetail.toolChoice.count}`"
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
                :key="tool"
                size="sm"
                color="neutral"
                variant="subtle"
              >
                {{ tool }}
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
              color="warning"
            />

            <div
              v-if="abilityMode === '2-1'"
              class="flex flex-wrap gap-3"
            >
              <div class="flex flex-col gap-1">
                <span class="text-xs text-muted">+2 к характеристике</span>

                <USelect
                  v-model="plusTwoAbility"
                  :items="abilityItems"
                  placeholder="Характеристика"
                  class="w-44"
                />
              </div>

              <div class="flex flex-col gap-1">
                <span class="text-xs text-muted">+1 к характеристике</span>

                <USelect
                  v-model="plusOneAbility"
                  :items="abilityItems"
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
                color="warning"
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
          </div>

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
