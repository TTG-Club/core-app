<script setup lang="ts">
  import type { FilterSelection, GameSearchFilter } from '../../model';

  import {
    CATALOG_FILTER_CITY_EXCLUDE_LABEL,
    CATALOG_FILTER_CITY_LABEL,
    CATALOG_FILTER_CITY_PLACEHOLDER,
    CATALOG_FILTER_COST_LABEL,
    CATALOG_FILTER_CROSSPLAY_LABEL,
    CATALOG_FILTER_DURATION_LABEL,
    CATALOG_FILTER_MAX_AGE_LABEL,
    CATALOG_FILTER_MIN_AGE_LABEL,
    CATALOG_FILTER_STATUS_LABEL,
    CATALOG_FILTER_SYSTEM_LABEL,
    CATALOG_FILTER_TYPE_LABEL,
    CATALOG_FILTERS_APPLY_LABEL,
    CATALOG_FILTERS_DESCRIPTION,
    CATALOG_FILTERS_RESET_LABEL,
    CATALOG_FILTERS_TITLE,
    CROSSPLAY_FILTER_OPTIONS,
    GAME_AGE_MAX,
    GAME_AGE_MIN,
    GAME_COST_TYPE_LABELS,
    GAME_COST_TYPES,
    GAME_DURATION_TYPE_LABELS,
    GAME_DURATION_TYPES,
    GAME_STATUS_LABELS,
    GAME_STATUSES,
    GAME_SYSTEM_LABELS,
    GAME_SYSTEMS,
    GAME_TYPE_ICONS,
    GAME_TYPE_LABELS,
    GAME_TYPES,
  } from '../../model';
  import GameFilterChips from './GameFilterChips.vue';

  const filter = defineModel<GameSearchFilter>({ required: true });

  const isOpen = defineModel<boolean>('open', { required: true });

  const { activeCount } = defineProps<{
    activeCount: number;
  }>();

  const emit = defineEmits<{
    reset: [];
  }>();

  /**
   * Строит варианты чипов из перечисления и карты подписей: сервисные значения
   * наружу не показываются.
   * @param values Значения перечисления.
   * @param labels Подписи значений.
   * @param icons Иконки значений, если они есть.
   */
  function toChipOptions<Value extends string>(
    values: ReadonlyArray<Value>,
    labels: Record<Value, string>,
    icons?: Record<Value, string>,
  ) {
    return values.map((value) => ({
      value,
      label: labels[value],
      icon: icons?.[value],
    }));
  }

  const systemOptions = toChipOptions(GAME_SYSTEMS, GAME_SYSTEM_LABELS);

  const typeOptions = toChipOptions(
    GAME_TYPES,
    GAME_TYPE_LABELS,
    GAME_TYPE_ICONS,
  );

  const durationOptions = toChipOptions(
    GAME_DURATION_TYPES,
    GAME_DURATION_TYPE_LABELS,
  );

  const costOptions = toChipOptions(GAME_COST_TYPES, GAME_COST_TYPE_LABELS);

  // Отменённая игра в выдачу не попадает вовсе: отбор по ней дал бы пустой
  // каталог, а не «покажи отменённые».
  const statusOptions = toChipOptions(
    GAME_STATUSES.filter((status) => status !== 'CANCELLED'),
    GAME_STATUS_LABELS,
  );

  /** Значение фильтра кроссплея для каждого варианта переключателя. */
  const CROSSPLAY_CHOICE_VALUES: Record<string, boolean> = {
    allowed: true,
    forbidden: false,
  };

  /**
   * Кроссплей у сервиса — трёхзначный: `true`, `false` или условие не задано.
   * В форме это один переключатель, поэтому значение переводится в строку и
   * обратно. Вариант «не важно» в карте отсутствует и даёт `null`.
   */
  const crossplayChoice = computed({
    get: () => {
      if (filter.value.crossplayAllowed === true) {
        return 'allowed';
      }

      if (filter.value.crossplayAllowed === false) {
        return 'forbidden';
      }

      return 'any';
    },
    set: (choice: string) => {
      filter.value = {
        ...filter.value,
        crossplayAllowed: CROSSPLAY_CHOICE_VALUES[choice] ?? null,
      };
    },
  });

  /**
   * Читает поле фильтра как список строк. Перечисления фильтра — строковые,
   * поэтому чипам достаточно строк, а типизацию значений держит сам фильтр.
   * @param value Значение поля фильтра.
   */
  function readStringList(value: GameSearchFilter[keyof GameSearchFilter]) {
    return Array.isArray(value) ? [...value] : [];
  }

  /** Двусторонняя привязка одного поля фильтра. */
  function createFilterField<Key extends keyof GameSearchFilter>(key: Key) {
    return computed({
      get: () => filter.value[key],
      set: (value: GameSearchFilter[Key]) => {
        filter.value = { ...filter.value, [key]: value };
      },
    });
  }

  /**
   * Двусторонняя привязка пары «искать — исключить» одним значением.
   *
   * Одним, а не двумя: нажатие на чип переносит значение из одной половины в
   * другую, и две раздельные записи в одном такте теряют первую — пропсы к
   * дочернему компоненту доезжают только на следующем рендере.
   *
   * @param includeKey Поле фильтра с искомыми значениями.
   * @param excludeKey Поле фильтра с исключёнными значениями.
   */
  function createChipSelection(
    includeKey: keyof GameSearchFilter,
    excludeKey: keyof GameSearchFilter,
  ) {
    return computed<FilterSelection>({
      get: () => ({
        included: readStringList(filter.value[includeKey]),
        excluded: readStringList(filter.value[excludeKey]),
      }),
      set: (value) => {
        filter.value = {
          ...filter.value,
          [includeKey]: value.included,
          [excludeKey]: value.excluded,
        };
      },
    });
  }

  const systemSelection = createChipSelection('system', 'excludeSystem');
  const typeSelection = createChipSelection('type', 'excludeType');

  const durationSelection = createChipSelection(
    'durationType',
    'excludeDurationType',
  );

  const costSelection = createChipSelection('costType', 'excludeCostType');
  const statusSelection = createChipSelection('status', 'excludeStatus');

  const cities = createFilterField('city');
  const excludedCities = createFilterField('excludeCity');
  const minAge = createFilterField('minAge');
  const maxAge = createFilterField('maxAge');

  /** Сбрасывает все условия подбора. */
  function handleReset(): void {
    emit('reset');
  }

  /** Закрывает панель фильтров. */
  function handleApply(): void {
    isOpen.value = false;
  }
</script>

<template>
  <USlideover
    v-model:open="isOpen"
    :title="CATALOG_FILTERS_TITLE"
    :description="CATALOG_FILTERS_DESCRIPTION"
  >
    <template #body>
      <div class="flex flex-col gap-6">
        <GameFilterChips
          v-model="systemSelection"
          :label="CATALOG_FILTER_SYSTEM_LABEL"
          :options="systemOptions"
        />

        <GameFilterChips
          v-model="typeSelection"
          :label="CATALOG_FILTER_TYPE_LABEL"
          :options="typeOptions"
        />

        <GameFilterChips
          v-model="durationSelection"
          :label="CATALOG_FILTER_DURATION_LABEL"
          :options="durationOptions"
        />

        <GameFilterChips
          v-model="costSelection"
          :label="CATALOG_FILTER_COST_LABEL"
          :options="costOptions"
        />

        <GameFilterChips
          v-model="statusSelection"
          :label="CATALOG_FILTER_STATUS_LABEL"
          :options="statusOptions"
        />

        <UFormField :label="CATALOG_FILTER_CITY_LABEL">
          <UInputTags
            v-model="cities"
            :placeholder="CATALOG_FILTER_CITY_PLACEHOLDER"
            class="w-full"
          />
        </UFormField>

        <UFormField :label="CATALOG_FILTER_CITY_EXCLUDE_LABEL">
          <UInputTags
            v-model="excludedCities"
            :placeholder="CATALOG_FILTER_CITY_PLACEHOLDER"
            class="w-full"
          />
        </UFormField>

        <UFormField :label="CATALOG_FILTER_CROSSPLAY_LABEL">
          <URadioGroup
            v-model="crossplayChoice"
            orientation="horizontal"
            :items="CROSSPLAY_FILTER_OPTIONS"
          />
        </UFormField>

        <div class="grid grid-cols-2 gap-3">
          <UFormField :label="CATALOG_FILTER_MIN_AGE_LABEL">
            <UInputNumber
              v-model="minAge"
              :min="GAME_AGE_MIN"
              :max="GAME_AGE_MAX"
              class="w-full"
            />
          </UFormField>

          <UFormField :label="CATALOG_FILTER_MAX_AGE_LABEL">
            <UInputNumber
              v-model="maxAge"
              :min="GAME_AGE_MIN"
              :max="GAME_AGE_MAX"
              class="w-full"
            />
          </UFormField>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full gap-2">
        <UButton
          color="neutral"
          variant="subtle"
          icon="tabler:rotate"
          :disabled="!activeCount"
          :label="CATALOG_FILTERS_RESET_LABEL"
          @click.left.exact.prevent="handleReset"
        />

        <UButton
          class="ml-auto"
          :label="CATALOG_FILTERS_APPLY_LABEL"
          @click.left.exact.prevent="handleApply"
        />
      </div>
    </template>
  </USlideover>
</template>
