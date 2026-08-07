<script setup lang="ts">
  import type {
    CharacterFeature,
    FeatureOriginGroup,
    FeatureTabFilter,
  } from '../../model';

  import { MarkupRender } from '~ui/markup';

  import { useCharacterSheet } from '../../composables';
  import {
    FEATURE_ORIGIN_GROUP_HINTS,
    FEATURE_ORIGIN_LABELS,
    getFeatureOriginGroups,
    getFeaturesAddMenuItems,
    getFilterChipClass,
    matchesFeatureFilter,
    SHEET_FEATURE_ROW_LABELS,
    SHEET_FILTER_LABELS,
    SHEET_REVEAL_CONTROL_CLASS,
    SHEET_TAB_EMPTY_LABELS,
    sortFeaturesByOriginGroup,
  } from '../../model';

  const props = defineProps<{
    features: CharacterFeature[];
  }>();

  const emit = defineEmits<{
    'add-feature': [];
    'add-feat': [];
    'edit-feature': [featureId: string];
    'remove-feature': [featureId: string];
  }>();

  // Добавление, правка и удаление особенностей меняют лист: без прав кнопка
  // «Добавить» прячется, а строчные кнопки правки и вовсе не разъезжаются.
  const { canEdit, editControlClass } = useCharacterSheet();

  const addMenuItems = getFeaturesAddMenuItems({
    onAddFeature: () => emit('add-feature'),
    onAddFeat: () => emit('add-feat'),
  });

  const expandedIds = ref(new Set<string>());

  function toggleFeature(featureId: string) {
    if (expandedIds.value.has(featureId)) {
      expandedIds.value.delete(featureId);

      return;
    }

    expandedIds.value.add(featureId);
  }

  function handleEditClick(featureId: string) {
    emit('edit-feature', featureId);
  }

  function handleRemove(featureId: string) {
    emit('remove-feature', featureId);
  }

  /**
   * Цвета бейджа происхождения: вид — зелёный, подвид — синий, класс —
   * основной цвет темы, черта — акцентный.
   */
  const ORIGIN_BADGE_COLORS = {
    species: 'success',
    lineage: 'info',
    class: 'primary',
    feat: 'secondary',
    none: 'neutral',
  } as const;

  /**
   * Колонка кнопок правки строки: пока на строку не навели, она схлопнута в
   * нулевую ширину — место под ней занимает название.
   */
  const ROW_ACTIONS_CLASS =
    'grid shrink-0 grid-cols-[0fr] transition-[grid-template-columns] duration-200';

  /**
   * Наведение (или переход с клавиатуры) раздвигает колонку, и название уступает
   * кнопкам место. Ниже `lg` (1024px) колонка развёрнута всегда — тот же порог,
   * что и у остальных кнопок правки листа (см. {@link SHEET_REVEAL_CONTROL_CLASS}):
   * на узком экране ховера может не быть вовсе, и правку с удалением особенности
   * иначе не найти.
   */
  const ROW_ACTIONS_REVEAL_CLASS =
    'group-hover/feature:grid-cols-[1fr] focus-within:grid-cols-[1fr] max-lg:grid-cols-[1fr]';

  /**
   * Внутренняя обёртка кнопок: `overflow-hidden` обнуляет минимальную ширину
   * ячейки грида (без него `0fr` не схлопнется под содержимое), а прозрачность
   * убирает кнопки из виду, пока колонка ещё разъезжается.
   */
  const ROW_ACTIONS_INNER_CLASS = `flex items-center gap-1 overflow-hidden pl-2 opacity-0 transition-opacity duration-200 group-hover/feature:opacity-100 focus-within:opacity-100 ${SHEET_REVEAL_CONTROL_CLASS}`;

  /**
   * Без прав на правку (лист чужой или заперт замком) колонка не разъезжается
   * вовсе: раздвигать строку ради пустоты на месте спрятанных кнопок незачем.
   */
  const rowActionsClass = computed(() =>
    canEdit.value
      ? `${ROW_ACTIONS_CLASS} ${ROW_ACTIONS_REVEAL_CLASS}`
      : ROW_ACTIONS_CLASS,
  );

  /** Отмеченные чипами источники; пусто — список не сужается. */
  const pickedOrigins = ref(new Set<FeatureOriginGroup>());

  /** Источники, которые вкладка уже показывает: по ним и отбирают. */
  const availableOrigins = computed(() =>
    getFeatureOriginGroups(props.features),
  );

  /**
   * Действующий отбор: источники считаются от доступных, поэтому выбор, которого
   * в списке уже нет (особенность убрали вместе с последним её источником), сам
   * собой перестаёт сужать список.
   */
  const featureFilter = computed<FeatureTabFilter>(() => ({
    origins: availableOrigins.value.filter((originGroup) =>
      pickedOrigins.value.has(originGroup),
    ),
  }));

  /** Список сужен: отбор есть что сбросить. */
  const hasActiveFilter = computed(
    () => featureFilter.value.origins.length > 0,
  );

  /** Ряд отбора: одного источника на весь список мало, отбирать нечего. */
  const hasFilterControls = computed(() => availableOrigins.value.length > 1);

  /**
   * Чипы источников, которые есть в списке: подпись целиком («Вид», «Черта») —
   * ряд коротких слов помещается и на узком листе. Чипы набираются по одному,
   * повторное нажатие снимает источник с отбора.
   */
  const originChips = computed(() =>
    availableOrigins.value.map((originGroup) => {
      const isPicked = featureFilter.value.origins.includes(originGroup);

      return {
        originGroup,
        label: FEATURE_ORIGIN_LABELS[originGroup],
        tooltip: FEATURE_ORIGIN_GROUP_HINTS[originGroup],
        isPicked,
        chipClass: getFilterChipClass(isPicked),
      };
    }),
  );

  /** Нажатие на чип источника: тем же чипом источник с отбора и снимается. */
  function handleOriginPick(originGroup: FeatureOriginGroup) {
    if (pickedOrigins.value.has(originGroup)) {
      pickedOrigins.value.delete(originGroup);

      return;
    }

    pickedOrigins.value.add(originGroup);
  }

  /** Нажатие на «Сбросить»: список возвращается целиком. */
  function handleFilterReset() {
    pickedOrigins.value.clear();
  }

  /**
   * Список идёт группами источников, а не тем порядком, в котором особенности
   * попали в лист: вид, класс, черты, свои записи. Вперемешку их читать
   * невозможно — особенности вида оказывались между умениями класса.
   */
  const displayRows = computed(() =>
    sortFeaturesByOriginGroup(
      props.features.filter((feature) =>
        matchesFeatureFilter(feature, featureFilter.value),
      ),
    ).map((feature) => {
      const isExpanded = expandedIds.value.has(feature.id);

      return {
        ...feature,
        isExpanded,
        showBadge: feature.origin !== 'none',
        originLabel: FEATURE_ORIGIN_LABELS[feature.origin],
        badgeColor: ORIGIN_BADGE_COLORS[feature.origin],
        chevronClass: isExpanded ? 'rotate-180' : '',
        hasDescription: feature.description.length > 0,
      };
    }),
  );

  /**
   * Подпись пустого места вкладки: пустой список либо отбор, под который ничего
   * не подошло; '' — списку есть что показать.
   */
  const emptyLabel = computed(() => {
    if (!props.features.length) {
      return SHEET_TAB_EMPTY_LABELS.features;
    }

    return displayRows.value.length ? '' : SHEET_FILTER_LABELS.empty;
  });
</script>

<template>
  <div class="flex flex-col gap-3 pt-2">
    <!-- Отбор стоит в одном ряду с «Добавить»: своей строки ряд из нескольких
      коротких чипов не стоит. Чипы идут от самого списка — источника, которого
      в нём нет, нет и среди чипов -->
    <div class="flex flex-wrap items-center gap-2">
      <div
        v-if="hasFilterControls"
        class="flex flex-wrap items-center gap-x-1.5 gap-y-2"
      >
        <UTooltip
          v-for="originChip in originChips"
          :key="originChip.originGroup"
          :text="originChip.tooltip"
        >
          <button
            type="button"
            :class="originChip.chipClass"
            :aria-pressed="originChip.isPicked"
            @click.left.exact.prevent="handleOriginPick(originChip.originGroup)"
          >
            {{ originChip.label }}
          </button>
        </UTooltip>

        <!-- Сброс появляется только при отборе: пустой кнопке в ряду делать
          нечего -->
        <UTooltip
          v-if="hasActiveFilter"
          :text="SHEET_FILTER_LABELS.resetHint"
        >
          <UButton
            icon="tabler:filter-off"
            :label="SHEET_FILTER_LABELS.reset"
            color="neutral"
            variant="ghost"
            size="xs"
            @click.left.exact.prevent="handleFilterReset"
          />
        </UTooltip>
      </div>

      <div class="ml-auto">
        <UDropdownMenu
          :items="addMenuItems"
          :content="{ align: 'end' }"
        >
          <UButton
            icon="tabler:plus"
            label="Добавить"
            color="neutral"
            variant="ghost"
            size="sm"
            :class="editControlClass"
          />
        </UDropdownMenu>
      </div>
    </div>

    <template v-if="displayRows.length">
      <div
        v-for="feature in displayRows"
        :key="feature.id"
        class="flex flex-col rounded-lg border border-default/50 bg-elevated/20 transition-colors hover:border-primary/60"
      >
        <div class="group/feature flex w-full items-center">
          <!-- Раскрытие описания повешено на две настоящие кнопки — название с
            пустым местом строки и стрелку. Растянутого на всю строку
            прозрачного слоя тут нет: кнопки правки стоят между ними, и слой
            пришлось бы перекрывать позиционированием, а поверх него нажатия по
            стрелке уже не доходили. -->
          <button
            type="button"
            class="flex min-w-0 grow cursor-pointer items-center gap-3 rounded-lg py-2 pl-3 text-left focus-visible:outline-2 focus-visible:outline-primary"
            :aria-expanded="feature.isExpanded"
            @click.left.exact.prevent="toggleFeature(feature.id)"
          >
            <UBadge
              v-if="feature.showBadge"
              size="sm"
              :color="feature.badgeColor"
              variant="subtle"
              class="shrink-0"
            >
              {{ feature.originLabel }}
            </UBadge>

            <span
              class="min-w-0 grow truncate text-sm font-medium text-highlighted"
            >
              {{ feature.name }}
            </span>

            <!-- Выбор умения бывает списком через запятую (несколько навыков,
              языков, черт), поэтому в строке он ужимается многоточием и занимает
              не больше половины ширины: несжимаемым он выезжал за карточку и
              ложился поверх кнопок правки. Целиком выбор читается в раскрытом
              описании ниже. -->
            <span
              v-if="feature.choice"
              class="max-w-1/2 min-w-0 truncate text-xs text-primary"
            >
              {{ feature.choice }}
            </span>
          </button>

          <div :class="rowActionsClass">
            <div :class="ROW_ACTIONS_INNER_CLASS">
              <UButton
                icon="tabler:pencil"
                color="neutral"
                variant="ghost"
                size="xs"
                square
                :class="editControlClass"
                :aria-label="`Редактировать особенность: ${feature.name}`"
                @click.left.exact.prevent="handleEditClick(feature.id)"
              />

              <UButton
                icon="tabler:trash"
                color="error"
                variant="ghost"
                size="xs"
                square
                :class="editControlClass"
                :aria-label="`Удалить особенность: ${feature.name}`"
                @click.left.exact.prevent="handleRemove(feature.id)"
              />
            </div>
          </div>

          <!-- Стрелка повторяет действие кнопки с названием, поэтому из обхода
            с клавиатуры и от скринридера скрыта: иначе одна и та же особенность
            занимала бы две остановки табом. -->
          <button
            type="button"
            tabindex="-1"
            aria-hidden="true"
            class="flex shrink-0 cursor-pointer items-center rounded-lg py-2 pr-3 pl-2"
            @click.left.exact.prevent="toggleFeature(feature.id)"
          >
            <UIcon
              name="tabler:chevron-down"
              class="size-4 text-muted transition-transform"
              :class="feature.chevronClass"
            />
          </button>
        </div>

        <div
          v-if="feature.isExpanded"
          class="flex flex-col gap-2 border-t border-default/50 px-3 py-2"
        >
          <!-- Строки источника и выбора переносятся: длинный список выбора
            иначе тянул бы раскрытый блок за края карточки -->
          <div
            v-if="feature.originName"
            class="flex flex-wrap items-baseline gap-x-1 text-xs"
          >
            <span class="text-muted">
              {{ SHEET_FEATURE_ROW_LABELS.origin }}
            </span>

            <span class="min-w-0 font-medium wrap-break-word text-default">
              {{ feature.originName }}
            </span>
          </div>

          <div
            v-if="feature.choice"
            class="flex flex-wrap items-baseline gap-x-1 text-xs"
          >
            <span class="text-muted">
              {{ SHEET_FEATURE_ROW_LABELS.choice }}
            </span>

            <span class="min-w-0 font-medium wrap-break-word text-primary">
              {{ feature.choice }}
            </span>
          </div>

          <MarkupRender
            v-if="feature.hasDescription"
            :render-node="feature.description"
            class="text-sm"
          />

          <span
            v-else
            class="text-xs text-dimmed"
          >
            {{ SHEET_FEATURE_ROW_LABELS.emptyDescription }}
          </span>
        </div>
      </div>
    </template>

    <!-- Пустое место объявляет о себе подписью: пустой список особенностей либо
      отбор, под который ничего не подошло -->
    <div
      v-if="emptyLabel"
      class="flex h-64 items-center justify-center rounded-lg border border-dashed border-default text-sm text-dimmed"
    >
      {{ emptyLabel }}
    </div>
  </div>
</template>
