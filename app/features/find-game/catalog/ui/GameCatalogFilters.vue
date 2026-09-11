<script setup lang="ts">
  import type { FilterSelection, GameSearchFilter } from '../../model';

  import { useCityDictionary } from '../../composables';
  import {
    CATALOG_FILTER_CITY_EXCLUDE_LABEL,
    CATALOG_FILTER_CITY_LABEL,
    CATALOG_FILTER_CITY_PLACEHOLDER,
    CATALOG_FILTER_COST_LABEL,
    CATALOG_FILTER_CROSSPLAY_LABEL,
    CATALOG_FILTER_DURATION_LABEL,
    CATALOG_FILTER_FAVORITE_HINT,
    CATALOG_FILTER_FAVORITE_LABEL,
    CATALOG_FILTER_FREE_SEATS_MIN,
    CATALOG_FILTER_MAX_AGE_LABEL,
    CATALOG_FILTER_MAX_FREE_SEATS_HINT,
    CATALOG_FILTER_MAX_FREE_SEATS_LABEL,
    CATALOG_FILTER_MAX_SEATS_TO_START_HINT,
    CATALOG_FILTER_MAX_SEATS_TO_START_LABEL,
    CATALOG_FILTER_MIN_AGE_LABEL,
    CATALOG_FILTER_SEATS_TO_START_MIN,
    CATALOG_FILTER_STATUS_LABEL,
    CATALOG_FILTER_SYSTEM_LABEL,
    CATALOG_FILTER_TYPE_LABEL,
    CATALOG_FILTERS_APPLY_LABEL,
    CATALOG_FILTERS_DESCRIPTION,
    CATALOG_FILTERS_RESET_LABEL,
    CATALOG_FILTERS_TITLE,
    countActiveGameFilters,
    createEmptyGameFilter,
    CROSSPLAY_FILTER_OPTIONS,
    GAME_AGE_MAX,
    GAME_AGE_MIN,
    GAME_COST_TYPE_LABELS,
    GAME_COST_TYPES,
    GAME_DURATION_TYPE_LABELS,
    GAME_DURATION_TYPES,
    GAME_FORM_AGE_ERROR,
    GAME_PLAYERS_MAX,
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

  const draft = ref<GameSearchFilter>(createEmptyGameFilter());
  const draftCount = computed(() => countActiveGameFilters(draft.value));

  const ageError = computed(() =>
    draft.value.minAge !== null
    && draft.value.maxAge !== null
    && draft.value.minAge > draft.value.maxAge
      ? GAME_FORM_AGE_ERROR
      : undefined,
  );

  const { isLoggedIn } = useUser();

  const citySearch = ref('');
  const excludedCitySearch = ref('');
  const { cityNames, isLoading: citiesLoading } = useCityDictionary(citySearch);

  const { cityNames: excludedCityNames, isLoading: excludedCitiesLoading } =
    useCityDictionary(excludedCitySearch);

  const cityOptions = computed(() => [
    ...new Set([...draft.value.city, ...cityNames.value]),
  ]);

  const excludedCityOptions = computed(() => [
    ...new Set([...draft.value.excludeCity, ...excludedCityNames.value]),
  ]);

  // Поля заменяют массивы целиком: черновик не изменяет применённый фильтр.
  watch(
    isOpen,
    (open) => {
      if (open) {
        draft.value = { ...filter.value };
      }
    },
    { immediate: true },
  );

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
      if (draft.value.crossplayAllowed === true) {
        return 'allowed';
      }

      if (draft.value.crossplayAllowed === false) {
        return 'forbidden';
      }

      return 'any';
    },
    set: (choice: string) => {
      draft.value = {
        ...draft.value,
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
      get: () => draft.value[key],
      set: (value: GameSearchFilter[Key]) => {
        draft.value = { ...draft.value, [key]: value };
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
        included: readStringList(draft.value[includeKey]),
        excluded: readStringList(draft.value[excludeKey]),
      }),
      set: (value) => {
        draft.value = {
          ...draft.value,
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

  const favorite = createFilterField('favorite');
  const cities = createFilterField('city');
  const excludedCities = createFilterField('excludeCity');
  const minAge = createFilterField('minAge');
  const maxAge = createFilterField('maxAge');
  const maxFreeSeats = createFilterField('maxFreeSeats');
  const maxSeatsToStart = createFilterField('maxSeatsToStart');

  /** Сбрасывает все условия подбора. */
  function handleReset(): void {
    draft.value = createEmptyGameFilter();
  }

  /** Применяет весь черновик одним изменением и закрывает панель. */
  function handleApply(): void {
    if (ageError.value) {
      return;
    }

    filter.value = { ...draft.value };
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
        <!-- Гостю переключателя нет: список избранного личный, и сервис
          вернул бы ему пустой каталог вместо подбора -->
        <UFormField
          v-if="isLoggedIn"
          :help="CATALOG_FILTER_FAVORITE_HINT"
        >
          <USwitch
            v-model="favorite"
            :label="CATALOG_FILTER_FAVORITE_LABEL"
          />
        </UFormField>

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
          <USelectMenu
            v-model="cities"
            v-model:search-term="citySearch"
            :items="cityOptions"
            :loading="citiesLoading"
            multiple
            ignore-filter
            :placeholder="CATALOG_FILTER_CITY_PLACEHOLDER"
            class="w-full"
          />
        </UFormField>

        <UFormField :label="CATALOG_FILTER_CITY_EXCLUDE_LABEL">
          <USelectMenu
            v-model="excludedCities"
            v-model:search-term="excludedCitySearch"
            :items="excludedCityOptions"
            :loading="excludedCitiesLoading"
            multiple
            ignore-filter
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
          <UFormField
            :label="CATALOG_FILTER_MIN_AGE_LABEL"
            :error="ageError"
          >
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

        <UFormField
          :label="CATALOG_FILTER_MAX_FREE_SEATS_LABEL"
          :help="CATALOG_FILTER_MAX_FREE_SEATS_HINT"
        >
          <UInputNumber
            v-model="maxFreeSeats"
            :min="CATALOG_FILTER_FREE_SEATS_MIN"
            :max="GAME_PLAYERS_MAX"
            class="w-full"
          />
        </UFormField>

        <UFormField
          :label="CATALOG_FILTER_MAX_SEATS_TO_START_LABEL"
          :help="CATALOG_FILTER_MAX_SEATS_TO_START_HINT"
        >
          <UInputNumber
            v-model="maxSeatsToStart"
            :min="CATALOG_FILTER_SEATS_TO_START_MIN"
            :max="GAME_PLAYERS_MAX"
            class="w-full"
          />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full gap-2">
        <UButton
          color="neutral"
          variant="subtle"
          icon="tabler:rotate"
          :disabled="!draftCount"
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
