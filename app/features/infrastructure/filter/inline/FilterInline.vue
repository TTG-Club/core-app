<script setup lang="ts">
  import type { FilterGroups } from '../types';

  import { FilterList } from '../list';
  import {
    FILTER_CONTROLS_RESET_LABEL,
    FILTER_DRAWER_SEARCH_PLACEHOLDER,
    FILTER_FILTERS_TITLE,
    FILTER_INLINE_RESET_LABEL,
    FILTER_SEARCH_DEBOUNCE,
    FILTER_SEARCH_EMPTY_TITLE,
  } from '../model';
  import { FilterSearchInput } from '../search-input';
  import { isFilterSearchable } from '../utils';

  /**
   * Фильтры раздела прямо в его панели: те же группы, что в дровере, но
   * свёрнутые и без «Применить» — выбор уходит наверх на каждое нажатие.
   */
  const { groups, isEdited = false } = defineProps<{
    groups: FilterGroups;

    /** Есть ли выбор: без него сбрасывать нечего, и кнопки сброса нет. */
    isEdited?: boolean;
  }>();

  defineEmits<{
    (event: 'update', value: FilterGroups): void;
    (event: 'reset'): void;
  }>();

  const search = ref('');
  const isEmpty = ref(false);

  // Поле остаётся на `search`, чтобы ввод не тормозил, а список считается по
  // дебаунснутому значению.
  const debouncedSearch = refDebounced(search, FILTER_SEARCH_DEBOUNCE);

  // Пустой запрос применяется без задержки: после крестика очистки список
  // иначе ещё 200 мс оставался бы отфильтрованным запросом, которого уже нет.
  const appliedSearch = computed(() =>
    search.value ? debouncedSearch.value : '',
  );

  const isSearchable = computed(() => isFilterSearchable(groups));

  const showEmptyResult = computed(
    () => !!appliedSearch.value && isEmpty.value,
  );
</script>

<template>
  <div class="flex flex-col gap-2">
    <!-- Сброс живёт в шапке блока: кнопки отбора, к которой он приклеен на -->
    <!-- узком экране, в панели нет. -->
    <div class="flex min-h-6 items-center justify-between gap-2">
      <span class="text-sm font-medium text-muted">
        {{ FILTER_FILTERS_TITLE }}
      </span>

      <UButton
        v-if="isEdited"
        :label="FILTER_INLINE_RESET_LABEL"
        :title="FILTER_CONTROLS_RESET_LABEL"
        icon="tabler:trash"
        color="error"
        variant="link"
        size="xs"
        class="px-0"
        @click.left.exact.prevent="$emit('reset')"
      />
    </div>

    <FilterSearchInput
      v-if="isSearchable"
      v-model="search"
      class="w-full"
      :placeholder="FILTER_DRAWER_SEARCH_PLACEHOLDER"
      icon="tabler:search"
    />

    <p
      v-if="showEmptyResult"
      class="py-2 text-sm text-muted"
    >
      {{ FILTER_SEARCH_EMPTY_TITLE }}
    </p>

    <FilterList
      :model-value="groups"
      :search="appliedSearch"
      collapsible
      @update:model-value="$emit('update', $event)"
      @empty="isEmpty = $event"
    />
  </div>
</template>
