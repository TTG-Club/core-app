<script setup lang="ts">
  import type { TabsItem } from '@nuxt/ui';

  import type { FeatureOptionEntry } from '~classes/model';

  import type { SheetChoiceOption } from '../../model';

  import { ClassDrawer } from '~classes/drawer';
  import { FeatureOptionsDrawer } from '~classes/feature-options-drawer';
  import { FeatDrawer } from '~feats/drawer';
  import { ItemDrawer } from '~items/drawer';
  import { SpellDrawer } from '~spells/drawer';
  import { UiResult } from '~ui/result';

  import {
    getChoiceSelectionSummary,
    SHEET_CHOICE_PICKER_LABELS,
    SHEET_WIZARD_SECTION_TITLE_CLASS,
  } from '../../model';
  import SheetChoiceDetailPane from './SheetChoiceDetailPane.vue';
  import SheetChoiceOptionRow from './SheetChoiceOptionRow.vue';
  import SheetSearchInput from './SheetSearchInput.vue';

  /** Строка списка: вариант с состоянием выбора. */
  interface OptionRow {
    option: SheetChoiceOption;
    selected: boolean;
    disabled: boolean;
    active: boolean;
  }

  /** Группа списка: варианты одного круга или одной категории. */
  interface OptionGroup {
    key: string;
    title: string;
    rows: OptionRow[];
  }

  /** Что показывает список: весь пул или уже отмеченное. */
  type PickerView = 'all' | 'selected';

  /**
   * Окно единого пикера: поиск, список вариантов группами и описание активного
   * варианта. Описание открывается дровером раздела по кнопке строки, а рядом
   * со списком остаётся панелью — но только там, где описания вообще есть:
   * навыкам и языкам её нечем заполнить, и окно сужается до одного списка.
   * Окно правит копию выбора до «Сохранить»: игрок может передумать и закрыть
   * его.
   */
  const props = defineProps<{
    title: string;

    /** Откуда выбор и сколько выбрать; пусто — подзаголовка нет. */
    subtitle?: string;

    options: SheetChoiceOption[];

    /** Сколько выбрать: 1 — одиночный выбор, 0 — без предела. */
    count: number;

    /** Значения, выбранные ранее. */
    selected: string[];

    /** Описание — только дровером: панель рядом со списком не нужна. */
    hideDetailPane?: boolean;
  }>();

  const emit = defineEmits<{
    /** Закрытие окна; выбор передаётся только при сохранении. */
    close: [values?: string[]];
  }>();

  const overlay = useOverlay();

  const { isMdOrGreater } = useBreakpoints();

  // Дроверы описаний с сайта; без destroyOnClose — повторный open() после
  // закрытия иначе падает («Overlay not found»).
  const spellDrawer = overlay.create(SpellDrawer, {
    props: { url: '', onClose: () => spellDrawer.close() },
  });

  const featDrawer = overlay.create(FeatDrawer, {
    props: { url: '', onClose: () => featDrawer.close() },
  });

  const itemDrawer = overlay.create(ItemDrawer, {
    props: { url: '', onClose: () => itemDrawer.close() },
  });

  // Переходы к классу и подклассам в предпросмотре скрыты: из окна выбора
  // уводить некуда, выбор всё равно делается в списке
  const classDrawer = overlay.create(ClassDrawer, {
    props: {
      url: '',
      hideNavigation: true,
      onClose: () => classDrawer.close(),
    },
  });

  const draft = ref<string[]>([...props.selected]);

  const searchTerm = ref('');

  const activeView = ref<PickerView>('all');

  const isMultiple = computed(() => props.count !== 1);

  /**
   * Панель описания рядом со списком: только там, где вариантам есть что
   * показать. У выбора навыка, языка или характеристики описаний нет — панель
   * пустовала бы, поэтому окно сужается до одного списка.
   */
  const isDetailPaneVisible = computed(
    () =>
      props.hideDetailPane !== true
      && props.options.some((option) => option.detail !== undefined),
  );

  /**
   * Описание читается панелью прямо в окне: тогда по названию идёт просмотр,
   * отмечает вариант отдельная кнопка с отметкой, а дровер не нужен. На узком
   * экране панели нет (она `md:`), и всё работает по-старому: название
   * отмечает, соседняя кнопка открывает дровер.
   */
  const isPreviewMode = computed(
    () => isDetailPaneVisible.value && isMdOrGreater.value,
  );

  const isLimitReached = computed(
    () =>
      isMultiple.value && props.count > 0 && draft.value.length >= props.count,
  );

  const draftSet = computed(() => new Set(draft.value));

  /**
   * Активный вариант — чьё описание показано в панели. Сначала это первый из
   * выбранных, а без выбора — первый в списке: пустая панель при открытии
   * выглядела бы сломанной.
   */
  const activeValue = ref<string | null>(
    props.options.find((option) => draftSet.value.has(option.value))?.value
      ?? props.options[0]?.value
      ?? null,
  );

  const activeOption = computed(
    () =>
      props.options.find((option) => option.value === activeValue.value)
      ?? null,
  );

  const filteredOptions = computed<SheetChoiceOption[]>(() => {
    const query = searchTerm.value.trim().toLowerCase();

    if (!query) {
      return props.options;
    }

    return withLayoutFallback(query, (searchQuery) =>
      props.options.filter(
        (option) =>
          option.label.toLowerCase().includes(searchQuery)
          || (option.sublabel ?? '').toLowerCase().includes(searchQuery),
      ),
    );
  });

  const isSelectedView = computed(
    () => isMultiple.value && activeView.value === 'selected',
  );

  const displayedOptions = computed(() =>
    isSelectedView.value
      ? filteredOptions.value.filter((option) =>
          draftSet.value.has(option.value),
        )
      : filteredOptions.value,
  );

  /** Группы списка в порядке первого появления: круги идут по возрастанию. */
  const groups = computed<OptionGroup[]>(() => {
    const byKey = new Map<string, OptionRow[]>();

    for (const option of displayedOptions.value) {
      const selected = draftSet.value.has(option.value);

      const row: OptionRow = {
        option,
        selected,
        disabled:
          option.disabled === true || (!selected && isLimitReached.value),
        // Подсветка активного означает «его описание в панели»: без панели
        // подсвечивать нечего
        active: isDetailPaneVisible.value && option.value === activeValue.value,
      };

      const key = option.group ?? '';

      byKey.set(key, [...(byKey.get(key) ?? []), row]);
    }

    return [...byKey.entries()].map(([key, rows]) => ({
      key,
      title: key,
      rows,
    }));
  });

  const isEmpty = computed(() => displayedOptions.value.length === 0);

  const emptyTitle = computed(() =>
    props.options.length
      ? SHEET_CHOICE_PICKER_LABELS.empty
      : SHEET_CHOICE_PICKER_LABELS.noOptions,
  );

  const countLabel = computed(() =>
    getChoiceSelectionSummary(draft.value.length, props.count),
  );

  const viewTabItems = computed<TabsItem[]>(() => [
    { value: 'all', label: SHEET_CHOICE_PICKER_LABELS.allTab },
    {
      value: 'selected',
      label: SHEET_CHOICE_PICKER_LABELS.selectedTab,
      badge: {
        label: String(draft.value.length),
        color: 'neutral',
        variant: 'subtle',
      },
    },
  ]);

  const isClearVisible = computed(() => draft.value.length > 0);

  /** Вариант умения для дровера описаний: своей страницы у него нет. */
  const markupDrawerEntries = computed<FeatureOptionEntry[]>(() => {
    const option = activeOption.value;

    const detail = option?.detail;

    if (!option || !detail || detail.kind !== 'markup') {
      return [];
    }

    return [
      {
        key: option.value,
        name: option.label,
        nameEng: option.sublabel ?? '',
        description: detail.description,
        additional: detail.additional ?? '',
        prerequisite: detail.prerequisite ?? '',
        requiredClassLevel: 0,
        grantedSpells: detail.grantedSpells,
      },
    ];
  });

  const isMarkupDrawerOpened = ref(false);

  /**
   * Переключает вариант в черновике: одиночный выбор заменяет прежний, выбор
   * нескольких копит до предела. Переключённый вариант становится активным —
   * его описание видно сразу.
   *
   * @param row строка списка.
   */
  function toggle(row: OptionRow) {
    if (row.disabled) {
      return;
    }

    activeValue.value = row.option.value;

    if (row.selected) {
      draft.value = draft.value.filter((value) => value !== row.option.value);

      return;
    }

    draft.value = isMultiple.value
      ? [...draft.value, row.option.value]
      : [row.option.value];
  }

  /**
   * Показывает описание варианта: панелью рядом со списком, а без панели —
   * дровером раздела поверх окна. Работает и когда предел выбора набран:
   * прочитать про вариант можно всегда, даже если взять его уже нельзя.
   *
   * @param row строка списка.
   */
  function showDetail(row: OptionRow) {
    activeValue.value = row.option.value;

    if (isPreviewMode.value) {
      return;
    }

    const detail = row.option.detail;

    if (!detail) {
      return;
    }

    switch (detail.kind) {
      case 'spell':
        spellDrawer.open({ url: detail.url });

        return;
      case 'feat':
        featDrawer.open({ url: detail.url });

        return;
      case 'item':
        itemDrawer.open({ url: detail.url });

        return;
      case 'class':
        classDrawer.open({ url: detail.url });

        return;
      case 'markup':
        isMarkupDrawerOpened.value = true;
    }
  }

  /**
   * Переключает вкладку списка.
   *
   * @param value значение вкладки.
   */
  function handleViewChange(value: string | number | undefined) {
    activeView.value = value === 'selected' ? 'selected' : 'all';
  }

  function clearDraft() {
    draft.value = [];
    activeView.value = 'all';
  }

  function handleSave() {
    emit('close', draft.value);
  }

  function handleCancel() {
    emit('close');
  }
</script>

<template>
  <UModal
    :title
    :description="subtitle"
    :ui="{ content: isDetailPaneVisible ? 'sm:max-w-4xl' : 'sm:max-w-lg' }"
  >
    <template #body>
      <!-- Высота по содержимому до предела экрана: у списка навыков без панели
        описания окно иначе стояло бы наполовину пустым -->
      <div class="flex max-h-[70dvh] min-h-96 flex-col gap-3">
        <SheetSearchInput
          v-model="searchTerm"
          :placeholder="SHEET_CHOICE_PICKER_LABELS.searchPlaceholder"
          class="shrink-0"
        />

        <!-- Отмеченное — соседней вкладкой, а не полосой чипов под списком:
          чипы росли с каждым выбором и отжимали список -->
        <UTabs
          v-if="isMultiple"
          :items="viewTabItems"
          :model-value="activeView"
          :content="false"
          size="sm"
          class="shrink-0"
          :ui="{ list: 'w-full' }"
          @update:model-value="handleViewChange"
        />

        <div class="flex min-h-0 grow gap-4">
          <div
            class="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-y-auto rounded-md border border-default p-1"
            :class="{ 'md:basis-5/12': isDetailPaneVisible }"
          >
            <UiResult
              v-if="isEmpty"
              :title="emptyTitle"
            />

            <div
              v-for="group in groups"
              :key="group.key"
              class="flex flex-col gap-1"
            >
              <div
                v-if="group.title"
                class="flex items-center gap-2 px-2 pt-2"
              >
                <span
                  class="shrink-0"
                  :class="SHEET_WIZARD_SECTION_TITLE_CLASS"
                >
                  {{ group.title }}
                </span>

                <div class="h-px grow bg-default/50" />
              </div>

              <SheetChoiceOptionRow
                v-for="row in group.rows"
                :key="row.option.value"
                :option="row.option"
                :selected="row.selected"
                :disabled="row.disabled"
                :active="row.active"
                :multiple="isMultiple"
                :preview="isPreviewMode"
                @toggle="toggle(row)"
                @detail="showDetail(row)"
              />
            </div>
          </div>

          <!-- Панель описания только на широком экране и только там, где
            описания есть: на узком и по кнопке строки открывается дровер -->
          <div
            v-if="isDetailPaneVisible"
            class="hidden min-h-0 min-w-0 overflow-y-auto rounded-md border border-default p-4 md:flex md:basis-7/12 md:flex-col"
          >
            <SheetChoiceDetailPane :option="activeOption" />
          </div>
        </div>
      </div>

      <FeatureOptionsDrawer
        v-if="markupDrawerEntries.length"
        v-model="isMarkupDrawerOpened"
        :options="markupDrawerEntries"
        :title="title"
      />
    </template>

    <template #footer>
      <div class="flex w-full flex-wrap items-center justify-between gap-2">
        <span class="min-w-0 text-sm font-medium text-highlighted">
          {{ countLabel }}
        </span>

        <div class="ml-auto flex gap-2">
          <UButton
            v-if="isClearVisible"
            icon="tabler:x"
            color="neutral"
            variant="ghost"
            :label="SHEET_CHOICE_PICKER_LABELS.clear"
            @click.left.exact.prevent="clearDraft"
          />

          <UButton
            :label="SHEET_CHOICE_PICKER_LABELS.cancel"
            color="neutral"
            variant="ghost"
            @click.left.exact.prevent="handleCancel"
          />

          <UButton
            :label="SHEET_CHOICE_PICKER_LABELS.save"
            color="primary"
            @click.left.exact.prevent="handleSave"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
