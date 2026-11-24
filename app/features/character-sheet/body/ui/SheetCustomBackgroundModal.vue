<script setup lang="ts">
  import type {
    AbilityBonusMode,
    AbilityKey,
    CharacterFeature,
    ClassChoice,
    FeatSelectOption,
    SheetChoiceControl,
    SheetChoiceOrigin,
  } from '../../model';

  import { ACTION_LABELS } from '~/shared/consts';
  import { FeatDrawer } from '~feats/drawer';

  import {
    useCharacterSheet,
    useChoiceHints,
    useChoiceSpellPools,
    useLazyCatalogSourceQuery,
    usePickedFeatChoices,
    useSheetOverlay,
    useToolCatalog,
  } from '../../composables';
  import {
    ABILITY_LABELS,
    ABILITY_ORDER,
    BACKGROUND_ABILITY_MODE_OPTIONS,
    buildChoiceControl,
    buildCustomBackgroundUrl,
    buildFeatFeature,
    collectPickedFeatGrants,
    computeAbilityBonuses,
    CUSTOM_BACKGROUND_ABILITY_SLOT_LABELS,
    CUSTOM_BACKGROUND_FEAT_CHOICE_ID,
    CUSTOM_BACKGROUND_LABELS,
    CUSTOM_BACKGROUND_NAME_MAX_LENGTH,
    CUSTOM_BACKGROUND_SKILL_COUNT,
    CUSTOM_BACKGROUND_TOOL_COUNT,
    FEAT_SOURCES_ASYNC_DATA_KEY,
    FEATS_FILTERS_PATH,
    FEATS_SELECT_PATH,
    FEATURE_ORIGIN_LABELS,
    getOriginFeatOptions,
    getOwnedSkillHints,
    getOwnedWeaponNames,
    getSpellChoicesKey,
    getToolNames,
    getVisibleFeatChoices,
    LANGUAGE_PROFICIENCY_GROUPS,
    ORIGIN_FEAT_ACQUISITION_LEVEL,
    parseFeatSelectOptions,
    resolveChoiceOptions,
    SKILL_DUPLICATE_WARNING,
    toNamedPickerOptions,
  } from '../../model';
  import SheetChoicePickerField from './SheetChoicePickerField.vue';
  import SheetPickedFeatChoices from './SheetPickedFeatChoices.vue';

  const { sheetKey } = defineProps<{
    /** Ключ открытого листа: с каким листом работает компонент. */
    sheetKey: string;
  }>();

  const emit = defineEmits<{
    /** `true` — своя предыстория применена к листу. */
    close: [isCreated?: boolean];
  }>();

  const toast = useToast();

  const overlay = useSheetOverlay();

  const { character, setBackground } = useCharacterSheet(sheetKey);

  // Дровер описания черты с сайта; без destroyOnClose — повторный open() после
  // закрытия иначе падает («Overlay not found»).
  const featPreviewDrawer = overlay.create(FeatDrawer, {
    props: {
      url: '',
      onClose: () => featPreviewDrawer.close(),
    },
  });

  // Каталог инструментов и черты грузятся фоном: форма открывается сразу, а
  // селекторы наполняются по мере ответов.
  const {
    getToolNamesForGroups,
    catalogItems: toolCatalogItems,
    resolveTools,
    isEmpty: isToolCatalogEmpty,
    load: loadToolCatalog,
  } = useToolCatalog();

  const { selectedSourceIds, load: loadFeatSources } =
    useLazyCatalogSourceQuery(FEAT_SOURCES_ASYNC_DATA_KEY, FEATS_FILTERS_PATH);

  const featCatalog = ref<FeatSelectOption[]>([]);

  const isFeatsLoading = ref(false);

  const hasFeatsError = ref(false);

  const draftName = ref('');

  const abilityMode = ref<AbilityBonusMode>('2-1');

  /** Характеристики по слотам прибавок; undefined — слот не заполнен. */
  const abilityChoices = ref<(AbilityKey | undefined)[]>([]);

  const draftSkills = ref<string[]>([]);

  const draftTools = ref<string[]>([]);

  /** URL выбранной черты происхождения; '' — предыстория без черты. */
  const draftFeatUrl = ref('');

  const isApplying = ref(false);

  const skillNames = computed(() =>
    character.value.skills.map((skill) => skill.name),
  );

  const ownedSkillHints = computed(() =>
    getOwnedSkillHints(character.value.skills),
  );

  const toolNames = computed(() => getToolNamesForGroups());

  const skillPickerOptions = computed(() =>
    toNamedPickerOptions(skillNames.value, ownedSkillHints.value),
  );

  const toolPickerOptions = computed(() =>
    toNamedPickerOptions(toolNames.value),
  );

  /** Подписи слотов прибавок текущего режима: их число и задаёт число слотов. */
  const abilitySlotLabels = computed(
    () => CUSTOM_BACKGROUND_ABILITY_SLOT_LABELS[abilityMode.value],
  );

  const abilitySlots = computed(() =>
    abilitySlotLabels.value.map((label, index) => ({
      index,
      label,
      // Незаполненный слот — undefined, а не пустая строка: значения селекта
      // типизированы ключами характеристик, и placeholder показывает именно оно.
      value: abilityChoices.value[index],
      // Одну характеристику нельзя усилить дважды: занятая в другом слоте
      // остаётся видимой, но недоступной.
      items: ABILITY_ORDER.map((key) => ({
        label: ABILITY_LABELS[key],
        value: key,
        disabled: abilityChoices.value.some(
          (choice, choiceIndex) => choiceIndex !== index && choice === key,
        ),
      })),
    })),
  );

  const selectedAbilities = computed(() =>
    abilityChoices.value.filter((choice): choice is AbilityKey =>
      Boolean(choice),
    ),
  );

  const abilityBonuses = computed(() =>
    computeAbilityBonuses(
      selectedAbilities.value,
      abilityMode.value,
      abilityChoices.value[0] ?? null,
      abilityChoices.value[1] ?? null,
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

  const isAbilityChoiceValid = computed(
    () => selectedAbilities.value.length === abilitySlotLabels.value.length,
  );

  const featItems = computed(() => [
    { label: CUSTOM_BACKGROUND_LABELS.featEmpty, value: '' },
    ...getOriginFeatOptions(featCatalog.value, selectedSourceIds.value).map(
      (option) => ({
        label: option.name,
        value: option.url,
        description: option.sourceLabel,
      }),
    ),
  ]);

  const isFeatPreviewVisible = computed(() => draftFeatUrl.value !== '');

  // Черта происхождения тоже может о чём-то спрашивать («Портальный странник» —
  // тип урона, «Посвящённый в магию» — список и заклинания): спросить нужно
  // здесь, на лист она ложится вместе с предысторией
  const {
    pickedFeats,
    choicesByPick: pickedFeatChoices,
    isLoading: isPickedFeatLoading,
    getChoices: getPickedFeatOwnChoices,
    load: loadPickedFeat,
    resolve: resolvePickedFeat,
  } = usePickedFeatChoices();

  /** Ответы игрока на выборы черты по идентификатору выбора. */
  const selections = ref<Record<string, string[]>>({});

  const proficientSkillNames = computed<string[]>(() =>
    character.value.skills
      .filter((skill) => skill.proficiency !== 'none')
      .map((skill) => skill.name),
  );

  const allLanguages = computed(() =>
    LANGUAGE_PROFICIENCY_GROUPS.flatMap((group) => group.items),
  );

  /** Все выборы взятой черты, а не только показанные. */
  const featChoices = computed<ClassChoice[]>(
    () => pickedFeatChoices.value[CUSTOM_BACKGROUND_FEAT_CHOICE_ID] ?? [],
  );

  const {
    getPool: getSpellPool,
    getSpellOptions,
    getStatus: getSpellPoolStatus,
    collectChosenSpells,
    load: loadSpellPools,
    retry: retrySpellPool,
  } = useChoiceSpellPools({
    sources: () => [{ choices: featChoices.value }],
    answers: selections,
  });

  /** Примета выборов заклинаний черты: пул догружается по её смене. */
  const spellChoicesKey = computed(() => getSpellChoicesKey(featChoices.value));

  // Цикла нет: обработчик правит только пулы, а примета считается по выборам
  // черты — от загруженного пула она не меняется.
  watch(spellChoicesKey, handleSpellChoicesChange);

  /** Догружает пулы заклинаний под выборы взятой черты. */
  function handleSpellChoicesChange(): void {
    void loadSpellPools();
  }

  const { getHints: choiceHints } = useChoiceHints({
    sheetKey,
    choices: featChoices,
    selections,
  });

  /**
   * Варианты выбора черты в зависимости от его типа: заклинания — из
   * загруженного пула, остальное — из листа и каталогов.
   *
   * @param choice выбор черты.
   * @returns названия вариантов.
   */
  function choiceOptions(choice: ClassChoice): string[] {
    if (choice.kind === 'spell') {
      return getSpellOptions(choice);
    }

    return resolveChoiceOptions(choice, {
      skillNames: skillNames.value,
      proficientSkillNames: proficientSkillNames.value,
      // Навыки самой предыстории тоже считаются владением: они лягут на лист
      // вместе с чертой, и компетентность в них выбрать можно.
      chosenProficientSkills: draftSkills.value,
      knownLanguages: character.value.proficiencies.languages,
      knownTools: getToolNames(character.value.proficiencies.tools),
      allLanguages: allLanguages.value,
      allTools: getToolNamesForGroups(choice.toolGroups),
      ownedWeaponNames: getOwnedWeaponNames(character.value),
      proficientSavingThrowNames: character.value.savingThrows
        .filter((savingThrow) => savingThrow.proficient)
        .map((savingThrow) => ABILITY_LABELS[savingThrow.key]),
    });
  }

  /**
   * Выбор для единого пикера: варианты, готовность пула, подписи поля и окна.
   *
   * @param choice выбор черты.
   * @param origin черта и предыстория — для подзаголовка окна.
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
   * Показанные выборы черты единым пикером. Выбор заклинаний ждёт ответа про
   * список: иначе пул был бы собран не из того списка.
   */
  const featChoiceControls = computed<SheetChoiceControl[]>(() => {
    const summary = pickedFeats.value[CUSTOM_BACKGROUND_FEAT_CHOICE_ID];

    if (!summary) {
      return [];
    }

    const origin: SheetChoiceOrigin = {
      featureName: summary.name,
      originLabel: `${FEATURE_ORIGIN_LABELS.feat} · ${
        draftName.value.trim() || CUSTOM_BACKGROUND_LABELS.title
      }`,
      level: null,
    };

    return getVisibleFeatChoices(featChoices.value, selections.value).map(
      (choice) => choiceControl(choice, origin),
    );
  });

  /** Все показанные выборы черты отвечены сполна — иначе применять рано. */
  const isFeatChoiceComplete = computed(() =>
    featChoiceControls.value.every(
      (control) =>
        (selections.value[control.choice.id]?.length ?? 0)
        >= control.requiredCount,
    ),
  );

  /**
   * Ответ игрока на выбор черты; лишнее сверх требуемого числа уже отсёк пикер.
   *
   * @param choice выбор черты.
   * @param values выбранные варианты.
   */
  function updateSelection(choice: ClassChoice, values: string[]): void {
    selections.value = { ...selections.value, [choice.id]: values };
  }

  /**
   * Пул заклинаний выбора не загрузился — запросить его заново.
   *
   * @param choice выбор заклинаний.
   */
  function handleSpellPoolRetry(choice: ClassChoice): void {
    void retrySpellPool(choice);
  }

  const isApplyDisabled = computed(
    () =>
      !draftName.value.trim()
      || !isAbilityChoiceValid.value
      || isPickedFeatLoading.value
      || !isFeatChoiceComplete.value,
  );

  /**
   * Смена режима сбрасывает выбор: у «+2/+1» и «+1/+1/+1» разное число слотов,
   * и перенесённый выбор оставил бы прибавку в слоте, которого больше нет.
   */
  watch(abilityMode, () => {
    abilityChoices.value = [];
  });

  async function loadOriginFeats(): Promise<void> {
    isFeatsLoading.value = true;
    hasFeatsError.value = false;

    try {
      // Категория черты приходит энумом только с `/select`, поэтому черты
      // происхождения отбираются по нему, а не по `/search`.
      const [response] = await Promise.all([
        $fetch<unknown>(FEATS_SELECT_PATH, { method: 'GET', retry: 0 }),
        loadFeatSources(),
      ]);

      featCatalog.value = parseFeatSelectOptions(response);
    } catch (error) {
      consola.error(CUSTOM_BACKGROUND_LABELS.featLoadErrorLog, error);
      hasFeatsError.value = true;
    } finally {
      isFeatsLoading.value = false;
    }
  }

  void loadToolCatalog();
  void loadOriginFeats();

  function handleAbilitySlot(slot: number, value: unknown) {
    const ability = ABILITY_ORDER.find((key) => key === value);

    abilityChoices.value = abilitySlotLabels.value.map((label, index) =>
      index === slot ? ability : abilityChoices.value[index],
    );
  }

  function showFeatDetailError() {
    toast.add({
      color: 'error',
      icon: 'tabler:alert-triangle',
      title: CUSTOM_BACKGROUND_LABELS.featDetailError,
    });
  }

  /**
   * Смена черты происхождения: деталь новой черты грузится сразу, чтобы её
   * выборы спросить тут же, под полем черты.
   *
   * @param value url выбранной черты; '' — без черты.
   */
  function handleFeat(value: unknown) {
    const url = typeof value === 'string' ? value : '';

    if (url === draftFeatUrl.value) {
      return;
    }

    draftFeatUrl.value = url;
    // Ответы прежней черты к новой не относятся
    selections.value = {};
    void loadPickedFeat(CUSTOM_BACKGROUND_FEAT_CHOICE_ID, url);
  }

  function handleFeatPreview() {
    if (draftFeatUrl.value) {
      featPreviewDrawer.open({ url: draftFeatUrl.value });
    }
  }

  /**
   * Особенность выбранной черты происхождения вместе с ответами на её выборы:
   * деталь черты пришла ещё при выборе, а если тогда не загрузилась —
   * запрашивается заново.
   *
   * @returns особенность черты; null — черта не выбрана или не загрузилась.
   */
  async function buildOriginFeature(): Promise<CharacterFeature | null> {
    if (!draftFeatUrl.value) {
      return null;
    }

    const summary = await resolvePickedFeat(
      CUSTOM_BACKGROUND_FEAT_CHOICE_ID,
      draftFeatUrl.value,
    );

    if (!summary) {
      return null;
    }

    const ownChoices = getPickedFeatOwnChoices(summary);

    // Уровень взятия — первый, как и у каталожной предыстории.
    return buildFeatFeature(summary, {
      level: ORIGIN_FEAT_ACQUISITION_LEVEL,
      // Владения — в снимок, заклинания — в список записи, остальное (тип
      // урона и прочее) лист хранит ответом
      ...collectPickedFeatGrants(summary, ownChoices, selections.value, [
        ...proficientSkillNames.value,
        ...draftSkills.value,
      ]),
      spells: collectChosenSpells({ choices: ownChoices }),
    });
  }

  async function handleApply() {
    if (isApplyDisabled.value || isApplying.value) {
      return;
    }

    isApplying.value = true;

    try {
      const featFeature = await buildOriginFeature();

      // Черта выбрана, но не загрузилась — предысторию не применяем: иначе на
      // листе осталась бы ссылка на черту без её описания.
      if (draftFeatUrl.value && !featFeature) {
        showFeatDetailError();

        return;
      }

      setBackground({
        background: {
          url: buildCustomBackgroundUrl(),
          name: draftName.value.trim(),
        },
        abilityBonuses: abilityBonuses.value,
        skills: draftSkills.value,
        // Выбранные игроком инструменты сверяются с каталогом сайта:
        // ненайденное станет своим инструментом без ссылки.
        tools: resolveTools(
          draftTools.value.map((name) => ({ name, url: null })),
        ),
        featUrl: draftFeatUrl.value || null,
        featFeature,
        // Своя предыстория расширенных даров не описывает: форма спрашивает
        // характеристики, навыки, инструменты и черту, и всё это уже применено
        backgroundFeature: null,
        // Стартового набора у своей предыстории нет — снаряжение собирается на
        // вкладке «Снаряжение». Набор прошлой предыстории при этом снимается.
        startingEquipment: null,
      });

      emit('close', true);
    } catch (error) {
      consola.error(CUSTOM_BACKGROUND_LABELS.featDetailErrorLog, error);
      showFeatDetailError();
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
    :title="CUSTOM_BACKGROUND_LABELS.title"
    :ui="{ content: 'sm:max-w-2xl' }"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-1">
          <span
            class="text-[10px] font-bold tracking-wider text-muted uppercase"
          >
            {{ CUSTOM_BACKGROUND_LABELS.nameTitle }}
          </span>

          <UInput
            v-model="draftName"
            :maxlength="CUSTOM_BACKGROUND_NAME_MAX_LENGTH"
            :placeholder="CUSTOM_BACKGROUND_LABELS.namePlaceholder"
          />
        </div>

        <div class="flex flex-col gap-2">
          <span
            class="text-[10px] font-bold tracking-wider text-muted uppercase"
          >
            {{ CUSTOM_BACKGROUND_LABELS.abilitiesTitle }}
          </span>

          <URadioGroup
            v-model="abilityMode"
            :items="BACKGROUND_ABILITY_MODE_OPTIONS"
            orientation="horizontal"
            variant="list"
            color="primary"
          />

          <div class="flex flex-wrap gap-3">
            <div
              v-for="slot in abilitySlots"
              :key="slot.index"
              class="flex flex-col gap-1"
            >
              <span class="text-xs text-muted">{{ slot.label }}</span>

              <USelect
                :model-value="slot.value"
                :items="slot.items"
                :placeholder="CUSTOM_BACKGROUND_LABELS.abilityPlaceholder"
                class="w-44"
                @update:model-value="handleAbilitySlot(slot.index, $event)"
              />
            </div>
          </div>

          <div
            v-if="bonusRows.length"
            class="flex flex-wrap gap-1"
          >
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

        <SheetChoicePickerField
          v-model="draftSkills"
          :title="CUSTOM_BACKGROUND_LABELS.skillsTitle"
          :explanation="CUSTOM_BACKGROUND_LABELS.skillsPlaceholder"
          :options="skillPickerOptions"
          :warning="SKILL_DUPLICATE_WARNING"
          :count="CUSTOM_BACKGROUND_SKILL_COUNT"
        />

        <SheetChoicePickerField
          v-if="!isToolCatalogEmpty"
          v-model="draftTools"
          :title="CUSTOM_BACKGROUND_LABELS.toolTitle"
          :explanation="CUSTOM_BACKGROUND_LABELS.toolPlaceholder"
          :options="toolPickerOptions"
          :count="CUSTOM_BACKGROUND_TOOL_COUNT"
        />

        <div
          v-else
          class="flex flex-col gap-1"
        >
          <span
            class="text-[10px] font-bold tracking-wider text-muted uppercase"
          >
            {{ CUSTOM_BACKGROUND_LABELS.toolTitle }}
          </span>

          <span class="text-sm text-dimmed italic">
            {{ CUSTOM_BACKGROUND_LABELS.toolEmpty }}
          </span>
        </div>

        <div class="flex flex-col gap-1">
          <span
            class="text-[10px] font-bold tracking-wider text-muted uppercase"
          >
            {{ CUSTOM_BACKGROUND_LABELS.featTitle }}
          </span>

          <span
            v-if="hasFeatsError"
            class="text-sm text-primary"
          >
            {{ CUSTOM_BACKGROUND_LABELS.featLoadError }}
          </span>

          <div
            v-else
            class="flex items-center gap-2"
          >
            <USelectMenu
              :model-value="draftFeatUrl"
              :items="featItems"
              :loading="isFeatsLoading"
              :placeholder="CUSTOM_BACKGROUND_LABELS.featPlaceholder"
              label-key="label"
              value-key="value"
              searchable
              class="min-w-0 grow"
              @update:model-value="handleFeat"
            />

            <UTooltip
              v-if="isFeatPreviewVisible"
              :text="CUSTOM_BACKGROUND_LABELS.featPreview"
            >
              <UButton
                icon="tabler:layout-sidebar-right-expand"
                color="neutral"
                variant="ghost"
                size="xs"
                square
                class="shrink-0"
                :aria-label="CUSTOM_BACKGROUND_LABELS.featPreviewAriaLabel"
                @click.left.exact.prevent="handleFeatPreview"
              />
            </UTooltip>
          </div>

          <SheetPickedFeatChoices
            :controls="featChoiceControls"
            :selections="selections"
            @update:selection="updateSelection"
            @retry="handleSpellPoolRetry"
          />
        </div>

        <span class="text-xs text-muted">
          {{ CUSTOM_BACKGROUND_LABELS.hint }}
        </span>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          :label="ACTION_LABELS.cancel"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="handleCancel"
        />

        <UButton
          :label="CUSTOM_BACKGROUND_LABELS.apply"
          color="primary"
          :loading="isApplying"
          :disabled="isApplyDisabled"
          @click.left.exact.prevent="handleApply"
        />
      </div>
    </template>
  </UModal>
</template>
