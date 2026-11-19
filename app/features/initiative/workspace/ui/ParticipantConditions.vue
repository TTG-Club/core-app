<script setup lang="ts">
  import type {
    ConditionExpiry,
    ConditionKey,
    ParticipantCondition,
  } from '~initiative/model';

  import {
    CONDITION_CATALOG,
    CONDITION_DESCRIPTION_TOOLTIP_UI,
    CONDITION_EXPIRY_LABEL,
    CONDITION_EXPIRY_OPTIONS,
    CONDITION_KEYS,
    CONDITION_LABELS,
    CONDITION_ROUNDS_PLURAL,
    DEFAULT_CONDITION_EXPIRY,
    DEFAULT_CONDITION_ROUNDS,
    MAX_CONDITION_ROUNDS,
    MIN_CONDITION_ROUNDS,
  } from '~initiative/model';

  import ConditionDescription from './ConditionDescription.vue';
  import ParticipantStatTile from './ParticipantStatTile.vue';

  const {
    conditions = [],
    participantName = '',
    round = 0,
    disabled = false,
  } = defineProps<{
    /** Наложенные состояния участника. */
    conditions?: Array<ParticipantCondition>;
    /** Имя участника — подзаголовок окна: оно оторвано от своей строки. */
    participantName?: string;
    /** Текущий раунд боя — из него считается остаток длительности. */
    round?: number;
    disabled?: boolean;
  }>();

  const emit = defineEmits<{
    add: [key: ConditionKey, rounds: number, expiry: ConditionExpiry];
    remove: [key: ConditionKey];
  }>();

  /** Сколько иконок состояний помещается в плитку строки. */
  const TILE_ICONS_LIMIT = 3;

  const isOpen = ref(false);

  // Длительность и момент снятия задаются один раз на открытие палитры: мастер
  // накладывает «на два раунда» сразу нескольким участникам подряд. Очищенное
  // поле `UInputNumber` отдаёт `undefined` — это та же «длительность по
  // умолчанию», то есть до снятия вручную.
  const rounds = ref<number | undefined>(DEFAULT_CONDITION_ROUNDS);
  const expiry = ref<ConditionExpiry>(DEFAULT_CONDITION_EXPIRY);

  // Наложенные состояния, у которых раскрыто описание. Раскрытие касанием, а не
  // подсказкой при наведении: на телефоне наведения нет.
  const expandedKeys = ref<Set<ConditionKey>>(new Set());

  const roundsValue = computed(() => rounds.value ?? DEFAULT_CONDITION_ROUNDS);

  const isTimed = computed(() => roundsValue.value > 0);

  const appliedKeys = computed(
    () => new Set(conditions.map((condition) => condition.key)),
  );

  // Наложенные вместе со справочной записью и готовыми подписями. Адрес
  // раскрытого описания отдельным полем: в шаблоне он сужается до строки только
  // у поля объекта, не у выборки по ключу.
  const appliedRows = computed(() =>
    conditions.map((condition) => {
      const option = CONDITION_CATALOG[condition.key];
      const isExpanded = expandedKeys.value.has(condition.key);

      const expandAction = isExpanded
        ? CONDITION_LABELS.hideDescription
        : CONDITION_LABELS.showDescription;

      return {
        condition,
        option,
        isExpanded,
        expandIcon: isExpanded ? 'tabler:chevron-up' : 'tabler:chevron-down',
        expandLabel: `${expandAction}: ${option.label}`,
        removeLabel: `${CONDITION_LABELS.remove}: ${option.label}`,
        expandedGlossaryUrl: isExpanded ? option.glossaryUrl : undefined,
      };
    }),
  );

  // Палитра со справочной записью и оформлением подсказки: с описанием она
  // шире и в несколько строк, без него — обычная однострочная.
  const paletteRows = CONDITION_KEYS.map((key) => {
    const option = CONDITION_CATALOG[key];

    return {
      key,
      option,
      tooltipUi: option.glossaryUrl
        ? CONDITION_DESCRIPTION_TOOLTIP_UI
        : undefined,
    };
  });

  const hasConditions = computed(() => conditions.length > 0);

  // В плитку влезает три иконки; когда состояний больше — показываем две и
  // счётчик остальных, чтобы колонки строк не разъезжались.
  const tileConditions = computed(() =>
    conditions.length > TILE_ICONS_LIMIT
      ? conditions.slice(0, TILE_ICONS_LIMIT - 1)
      : conditions,
  );

  const hiddenCount = computed(
    () => conditions.length - tileConditions.value.length,
  );

  // Подпись триггера: перечисление наложенного (в тултипе и для скринридера),
  // у пустой плитки — приглашение наложить.
  const triggerLabel = computed(() => {
    if (!hasConditions.value) {
      return CONDITION_LABELS.add;
    }

    const names = conditions
      .map((condition) => CONDITION_CATALOG[condition.key].label)
      .join(', ');

    return `${CONDITION_LABELS.title}: ${names}`;
  });

  /**
   * Остаток длительности состояния и момент снятия.
   * @param condition Наложенное состояние.
   */
  function remainingText(condition: ParticipantCondition): string {
    if (condition.expiresAtRound === null) {
      return CONDITION_LABELS.permanent;
    }

    const left = Math.max(0, condition.expiresAtRound - round);
    const noun = getPlural(left, CONDITION_ROUNDS_PLURAL);
    const moment = CONDITION_EXPIRY_LABEL[condition.expiresOn];

    return `${CONDITION_LABELS.remaining} ${left} ${noun} · ${moment}`;
  }

  /**
   * Цвет кнопки состояния в палитре: наложенное подсвечено.
   * @param key Ключ состояния.
   */
  function paletteColor(key: ConditionKey): 'warning' | 'neutral' {
    return appliedKeys.value.has(key) ? 'warning' : 'neutral';
  }

  /**
   * Оформление кнопки состояния в палитре: наложенное залито.
   * @param key Ключ состояния.
   */
  function paletteVariant(key: ConditionKey): 'soft' | 'ghost' {
    return appliedKeys.value.has(key) ? 'soft' : 'ghost';
  }

  /**
   * Раскрывает или сворачивает описание наложенного состояния.
   * @param key Ключ состояния.
   */
  function toggleDescription(key: ConditionKey): void {
    const next = new Set(expandedKeys.value);

    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }

    expandedKeys.value = next;
  }

  /**
   * Накладывает состояние с выбранной длительностью. Окно остаётся открытым:
   * состояния вешают пачкой, а список наложенного тут же показывает результат.
   * @param key Ключ состояния.
   */
  function add(key: ConditionKey): void {
    emit('add', key, roundsValue.value, expiry.value);
  }

  /**
   * Снимает состояние. Окно остаётся открытым: состояния снимают пачкой.
   * @param key Ключ состояния.
   */
  function remove(key: ConditionKey): void {
    emit('remove', key);
  }
</script>

<template>
  <div class="w-full">
    <!-- Триггер — плитка в ряду статов: наложенное видно иконками прямо в
         строке, а управление живёт в окне. Так состояния не занимают
         отдельную строку ни на десктопе, ни на телефоне. -->
    <UTooltip :text="triggerLabel">
      <button
        type="button"
        class="w-full cursor-pointer rounded-lg transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        :disabled
        :aria-label="triggerLabel"
        @click.left.exact.prevent="isOpen = true"
      >
        <ParticipantStatTile
          :label="CONDITION_LABELS.title"
          class="w-full transition-colors hover:border-accented"
        >
          <span class="flex items-center gap-1">
            <template v-if="hasConditions">
              <UIcon
                v-for="condition in tileConditions"
                :key="condition.key"
                :name="CONDITION_CATALOG[condition.key].icon"
                class="size-4 text-warning"
              />

              <span
                v-if="hiddenCount"
                class="text-xs text-warning"
              >
                +{{ hiddenCount }}
              </span>
            </template>

            <UIcon
              v-else
              name="tabler:plus"
              class="size-4 text-muted"
            />
          </span>
        </ParticipantStatTile>
      </button>
    </UTooltip>

    <!-- Окно по центру, а не поповер у плитки: список наложенного плюс палитра
         из двух десятков состояний у края экрана телефона не помещались. -->
    <UModal
      v-model:open="isOpen"
      :title="CONDITION_LABELS.title"
      :description="participantName"
    >
      <template #body>
        <div class="flex flex-col gap-4">
          <!-- Наложенные: что висит и сколько осталось. Списком, а не тултипом
               на иконке, — на телефоне тултипа нет, а снять надо одним
               касанием. Длинный список прокручивается: с десятком состояний
               окно иначе перестало бы помещаться в экран телефона. -->
          <div
            v-if="hasConditions"
            class="flex max-h-52 flex-col gap-1 overflow-y-auto"
          >
            <div
              v-for="row in appliedRows"
              :key="row.condition.key"
              class="shrink-0 rounded-md bg-elevated"
            >
              <div class="flex items-center gap-2 py-1 pr-1 pl-2">
                <UIcon
                  :name="row.option.icon"
                  class="size-5 shrink-0 text-warning"
                />

                <div class="min-w-0 flex-1">
                  <div class="truncate text-sm font-medium text-highlighted">
                    {{ row.option.label }}
                  </div>

                  <div class="truncate text-xs text-muted">
                    {{ remainingText(row.condition) }}
                  </div>
                </div>

                <!-- Описание раскрывается касанием: подсказки при наведении
                     на телефоне нет. Только у состояний из правил — у боевых
                     эффектов сверх них статьи в глоссарии нет. -->
                <UButton
                  v-if="row.option.glossaryUrl"
                  :icon="row.expandIcon"
                  color="neutral"
                  variant="ghost"
                  :aria-label="row.expandLabel"
                  :aria-expanded="row.isExpanded"
                  @click.left.exact.prevent="
                    toggleDescription(row.condition.key)
                  "
                />

                <UButton
                  icon="tabler:x"
                  color="neutral"
                  variant="ghost"
                  :disabled
                  :aria-label="row.removeLabel"
                  @click.left.exact.prevent="remove(row.condition.key)"
                />
              </div>

              <ConditionDescription
                v-if="row.expandedGlossaryUrl"
                :glossary-url="row.expandedGlossaryUrl"
                class="px-2 pb-2"
              />
            </div>
          </div>

          <div class="flex items-center gap-2">
            <span class="shrink-0 text-xs text-secondary">
              {{ CONDITION_LABELS.add }}
            </span>

            <div class="h-px flex-1 bg-default" />
          </div>

          <div class="flex flex-col gap-3 sm:flex-row">
            <UFormField
              class="sm:w-44"
              :label="CONDITION_LABELS.rounds"
              :help="CONDITION_LABELS.roundsHint"
            >
              <UInputNumber
                v-model="rounds"
                :min="MIN_CONDITION_ROUNDS"
                :max="MAX_CONDITION_ROUNDS"
                class="w-full"
              />
            </UFormField>

            <!-- Момент снятия нужен только состоянию со сроком: бессрочное
                 держится до снятия вручную, и выбирать тут нечего. -->
            <UFormField
              v-if="isTimed"
              class="flex-1"
              :label="CONDITION_LABELS.expiry"
            >
              <USelect
                v-model="expiry"
                :items="CONDITION_EXPIRY_OPTIONS"
                value-key="value"
                class="w-full"
              />
            </UFormField>
          </div>

          <div class="grid grid-cols-5 gap-1 sm:grid-cols-7">
            <!-- На наведение подсказка показывает и правила состояния:
                 выбрать можно, не накладывая. Грузится статья, только когда
                 подсказку открыли, — задержка подсказки не даёт грузить всё
                 подряд, пока мышь идёт по сетке. На телефоне описание
                 раскрывается в списке наложенного. -->
            <UTooltip
              v-for="row in paletteRows"
              :key="row.key"
              :text="row.option.label"
              :ui="row.tooltipUi"
            >
              <template
                v-if="row.option.glossaryUrl"
                #content
              >
                <span class="font-medium text-highlighted">
                  {{ row.option.label }}
                </span>

                <ConditionDescription :glossary-url="row.option.glossaryUrl" />
              </template>

              <UButton
                class="w-full justify-center"
                :icon="row.option.icon"
                :color="paletteColor(row.key)"
                :variant="paletteVariant(row.key)"
                :disabled
                :aria-label="row.option.label"
                @click.left.exact.prevent="add(row.key)"
              />
            </UTooltip>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
