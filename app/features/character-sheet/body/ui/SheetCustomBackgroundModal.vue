<script setup lang="ts">
  import type {
    AbilityBonusMode,
    AbilityKey,
    CharacterFeature,
    FeatSelectOption,
  } from '../../model';

  import { FeatDrawer } from '~feats/drawer';

  import {
    useCharacterSheet,
    useLazyCatalogSourceQuery,
    useToolCatalog,
  } from '../../composables';
  import {
    ABILITY_LABELS,
    ABILITY_ORDER,
    BACKGROUND_ABILITY_MODE_OPTIONS,
    buildCustomBackgroundUrl,
    buildFeatFeature,
    computeAbilityBonuses,
    CUSTOM_BACKGROUND_ABILITY_SLOT_LABELS,
    CUSTOM_BACKGROUND_LABELS,
    CUSTOM_BACKGROUND_NAME_MAX_LENGTH,
    CUSTOM_BACKGROUND_SKILL_COUNT,
    CUSTOM_BACKGROUND_TOOL_COUNT,
    FEAT_SOURCES_ASYNC_DATA_KEY,
    FEATS_FILTERS_PATH,
    FEATS_SELECT_PATH,
    fetchFeatDetail,
    getOriginFeatOptions,
    getOwnedSkillHints,
    ORIGIN_FEAT_ACQUISITION_LEVEL,
    parseFeatSelectOptions,
    SKILL_DUPLICATE_WARNING,
  } from '../../model';
  import SheetChoiceSelect from './SheetChoiceSelect.vue';

  const emit = defineEmits<{
    /** `true` — своя предыстория применена к листу. */
    close: [isCreated?: boolean];
  }>();

  const toast = useToast();

  const overlay = useOverlay();

  const { character, setBackground } = useCharacterSheet();

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

  const isApplyDisabled = computed(
    () => !draftName.value.trim() || !isAbilityChoiceValid.value,
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

  function handleFeat(value: unknown) {
    draftFeatUrl.value = typeof value === 'string' ? value : '';
  }

  function handleFeatPreview() {
    if (draftFeatUrl.value) {
      featPreviewDrawer.open({ url: draftFeatUrl.value });
    }
  }

  /**
   * Особенность выбранной черты происхождения: описание черты догружается с
   * сайта, как и в мастере выбора каталожной предыстории.
   *
   * @returns особенность черты; null — черта не выбрана или не загрузилась.
   */
  async function buildOriginFeature(): Promise<CharacterFeature | null> {
    if (!draftFeatUrl.value) {
      return null;
    }

    const summary = await fetchFeatDetail(draftFeatUrl.value);

    // Уровень взятия — первый, как и у каталожной предыстории.
    return summary
      ? buildFeatFeature(summary, false, ORIGIN_FEAT_ACQUISITION_LEVEL)
      : null;
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

        <div class="flex flex-col gap-1">
          <span
            class="text-[10px] font-bold tracking-wider text-muted uppercase"
          >
            {{ CUSTOM_BACKGROUND_LABELS.skillsTitle }}
          </span>

          <SheetChoiceSelect
            v-model="draftSkills"
            :items="skillNames"
            :hints="ownedSkillHints"
            :warning="SKILL_DUPLICATE_WARNING"
            :count="CUSTOM_BACKGROUND_SKILL_COUNT"
            :placeholder="CUSTOM_BACKGROUND_LABELS.skillsPlaceholder"
          />
        </div>

        <div class="flex flex-col gap-1">
          <span
            class="text-[10px] font-bold tracking-wider text-muted uppercase"
          >
            {{ CUSTOM_BACKGROUND_LABELS.toolTitle }}
          </span>

          <SheetChoiceSelect
            v-if="!isToolCatalogEmpty"
            v-model="draftTools"
            :items="toolNames"
            :count="CUSTOM_BACKGROUND_TOOL_COUNT"
            :placeholder="CUSTOM_BACKGROUND_LABELS.toolPlaceholder"
          />

          <span
            v-else
            class="text-sm text-dimmed italic"
          >
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
        </div>

        <span class="text-xs text-muted">
          {{ CUSTOM_BACKGROUND_LABELS.hint }}
        </span>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          label="Отмена"
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
