<script setup lang="ts">
  import type { FilterGroups } from '~infrastructure/filter';

  import type { GameSearchFilter } from '../../model';

  import { FilterDrawer } from '~infrastructure/filter';
  import { FILTER_FILTERS_TITLE } from '~infrastructure/filter/model';
  import { InputNumberClearable } from '~ui/input';

  import { useCityDictionary, useGameSystems } from '../../composables';
  import {
    applyGameFilterGroups,
    CATALOG_FILTER_AGE_FROM_LABEL,
    CATALOG_FILTER_AGE_TO_LABEL,
    CATALOG_FILTER_CITY_LABEL,
    CATALOG_FILTER_CITY_PLACEHOLDER,
    CATALOG_FILTER_FREE_SEATS_MIN,
    CATALOG_FILTER_MAX_FREE_SEATS_FIELD_LABEL,
    CATALOG_FILTER_MAX_FREE_SEATS_HINT,
    CATALOG_FILTER_MAX_SEATS_TO_START_FIELD_LABEL,
    CATALOG_FILTER_MAX_SEATS_TO_START_HINT,
    CATALOG_FILTER_SEATS_TO_START_MIN,
    createEmptyGameFilter,
    GAME_AGE_MAX,
    GAME_AGE_MIN,
    GAME_FACT_LABELS,
    GAME_FORM_AGE_ERROR,
    GAME_PLAYERS_MAX,
    GAME_SEATS_LABEL,
    toGameFilterGroups,
  } from '../../model';

  /**
   * Фильтры каталога в общей панели фильтров сайта: те же группы чипов с
   * «Выбрать все» и «Исключать», что в справочнике. Условия, которые чипами
   * не выражаются, — город, возраст и места — стоят под группами полями в
   * таких же рамках.
   */
  const filter = defineModel<GameSearchFilter>({ required: true });

  const isOpen = defineModel<boolean>('open', { required: true });

  const { isLoggedIn } = useUser();

  // Панель сама клонирует группы при открытии и отдаёт их обратно только по
  // «Применить», поэтому группы строятся прямо из применённого фильтра.
  const { systems } = useGameSystems();

  const groups = computed(() =>
    toGameFilterGroups(filter.value, isLoggedIn.value, systems.value),
  );

  // Поля без групп панель не знает — их черновик держит этот компонент.
  // Поля заменяют значения целиком: черновик не изменяет применённый фильтр.
  const draft = ref<GameSearchFilter>(createEmptyGameFilter());

  watch(
    isOpen,
    (open) => {
      if (open) {
        draft.value = { ...filter.value };
      }
    },
    { immediate: true },
  );

  const ageError = computed(() =>
    draft.value.minAge !== null
    && draft.value.maxAge !== null
    && draft.value.minAge > draft.value.maxAge
      ? GAME_FORM_AGE_ERROR
      : undefined,
  );

  const citySearch = ref('');
  const { cityNames, isLoading: citiesLoading } = useCityDictionary(citySearch);

  const cityOptions = computed(() => [
    ...new Set([...draft.value.city, ...cityNames.value]),
  ]);

  /**
   * Двусторонняя привязка одного поля черновика.
   * @param key Поле фильтра.
   */
  function createDraftField<Key extends keyof GameSearchFilter>(key: Key) {
    return computed({
      get: () => draft.value[key],
      set: (value: GameSearchFilter[Key]) => {
        draft.value = { ...draft.value, [key]: value };
      },
    });
  }

  const cities = createDraftField('city');
  const minAge = createDraftField('minAge');
  const maxAge = createDraftField('maxAge');
  const maxFreeSeats = createDraftField('maxFreeSeats');
  const maxSeatsToStart = createDraftField('maxSeatsToStart');

  /**
   * Применяет группы вместе с полями одним изменением фильтра и закрывает
   * панель. Перевёрнутый возраст сервис отверг бы целиком, поэтому с ним
   * панель остаётся открытой и показывает ошибку у поля.
   * @param appliedGroups Группы панели после «Применить».
   */
  function handleSave(appliedGroups: FilterGroups): void {
    if (ageError.value) {
      return;
    }

    filter.value = applyGameFilterGroups(
      draft.value,
      appliedGroups,
      systems.value,
    );

    isOpen.value = false;
  }

  /** Сбрасывает все условия подбора и закрывает панель. */
  function handleReset(): void {
    filter.value = createEmptyGameFilter();
    isOpen.value = false;
  }

  const [DefineFieldBox, ReuseFieldBox] = createReusableTemplate<{
    title: string;
  }>();
</script>

<template>
  <!-- Рамка повторяет группу чипов панели: заголовок сверху, поля под ним -->
  <DefineFieldBox v-slot="{ title, $slots }">
    <section class="flex flex-col">
      <div
        class="flex items-center rounded-t-xl border border-default px-3 py-2"
      >
        <span class="font-medium">{{ title }}</span>
      </div>

      <div
        class="flex flex-col gap-3 rounded-b-xl border-x border-b border-default px-3 py-4"
      >
        <component :is="$slots.default" />
      </div>
    </section>
  </DefineFieldBox>

  <FilterDrawer
    v-model="isOpen"
    :title="FILTER_FILTERS_TITLE"
    :groups="groups"
    @save="handleSave"
    @reset="handleReset"
  >
    <template #append>
      <ReuseFieldBox :title="CATALOG_FILTER_CITY_LABEL">
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
      </ReuseFieldBox>

      <ReuseFieldBox :title="GAME_FACT_LABELS.age">
        <div class="grid grid-cols-2 gap-3">
          <UFormField
            :label="CATALOG_FILTER_AGE_FROM_LABEL"
            :error="ageError"
          >
            <InputNumberClearable
              v-model="minAge"
              :min="GAME_AGE_MIN"
              :max="GAME_AGE_MAX"
              class="w-full"
            />
          </UFormField>

          <UFormField :label="CATALOG_FILTER_AGE_TO_LABEL">
            <InputNumberClearable
              v-model="maxAge"
              :min="GAME_AGE_MIN"
              :max="GAME_AGE_MAX"
              class="w-full"
            />
          </UFormField>
        </div>
      </ReuseFieldBox>

      <!-- В строку, как возраст; на узком экране подписям двух колонок
        тесно, и поля встают друг под другом -->
      <ReuseFieldBox :title="GAME_SEATS_LABEL">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <UFormField
            :label="CATALOG_FILTER_MAX_FREE_SEATS_FIELD_LABEL"
            :help="CATALOG_FILTER_MAX_FREE_SEATS_HINT"
          >
            <InputNumberClearable
              v-model="maxFreeSeats"
              :min="CATALOG_FILTER_FREE_SEATS_MIN"
              :max="GAME_PLAYERS_MAX"
              class="w-full"
            />
          </UFormField>

          <UFormField
            :label="CATALOG_FILTER_MAX_SEATS_TO_START_FIELD_LABEL"
            :help="CATALOG_FILTER_MAX_SEATS_TO_START_HINT"
          >
            <InputNumberClearable
              v-model="maxSeatsToStart"
              :min="CATALOG_FILTER_SEATS_TO_START_MIN"
              :max="GAME_PLAYERS_MAX"
              class="w-full"
            />
          </UFormField>
        </div>
      </ReuseFieldBox>
    </template>
  </FilterDrawer>
</template>
