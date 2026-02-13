<script setup lang="ts">
  import { cloneDeep } from 'es-toolkit';

  import { FilterDrawer } from '../drawer';
  import { FilterPreview } from '../preview';

  import type { Filter } from '../types';

  const { isPending = false, showPreview = false } = defineProps<{
    isPending?: boolean;
    showPreview?: boolean;
  }>();

  const search = defineModel<string>('search');
  const filter = defineModel<Filter>('filter');

  const route = useRoute();
  const { share } = useCopyAndShare();

  const { greaterOrEqual } = useBreakpoints();

  const opened = ref(false);
  const localSearch = ref(toValue(search) ?? '');
  const isLarge = greaterOrEqual(Breakpoint.LG);

  const urlForCopy = computed(() => {
    return getOrigin() + route.fullPath;
  });

  const isEdited = computed(
    () =>
      !!filter.value &&
      filter.value.groups.some((group) =>
        group.filters.some((item) => item.selected !== null),
      ),
  );

  watchDebounced(
    localSearch,
    (value) => {
      if (value && value.length >= 2) {
        search.value = value;

        return;
      }

      if (!value) {
        search.value = undefined;
      }
    },
    {
      debounce: 700,
    },
  );

  function save(payload: Filter) {
    filter.value = payload;
    close();
  }

  function reset() {
    if (!filter.value) {
      close();

      return;
    }

    const cloned = cloneDeep(filter.value);

    filter.value = {
      ...cloned,
      groups: cloned.groups.map((group) => ({
        ...group,
        filters: group.filters.map((item) => ({
          ...item,
          selected: null,
        })),
      })),
    };

    close();
  }

  function close() {
    opened.value = false;
  }
</script>

<template>
  <div class="flex gap-2 lg:flex-col lg:gap-4">
    <UInput
      v-model="localSearch"
      placeholder="Поиск..."
      allow-clear
      :ui="{ trailing: 'pe-0.5' }"
    >
      <template
        v-if="localSearch"
        #trailing
      >
        <UButton
          icon="i-ttg-x"
          variant="link"
          color="neutral"
          size="sm"
          @click.left.exact.prevent="localSearch = ''"
        />
      </template>
    </UInput>

    <div class="flex gap-2">
      <UFieldGroup class="w-full space-x-px">
        <UButton
          :disabled="!filter"
          :loading="isPending"
          icon="i-fluent-filter-24-regular"
          label="Фильтр"
          block
          @click.left.exact.prevent="opened = true"
        />

        <UButton
          v-if="isEdited"
          title="Очистить фильтр"
          icon="i-ttg-remove"
          @click.left.exact.prevent="reset"
        />
      </UFieldGroup>

      <UButton
        icon="i-fluent-share-24-regular"
        title="Поделиться ссылкой"
        @click.left.exact.prevent="share(urlForCopy)"
      />
    </div>

    <ClientOnly>
      <template v-if="isLarge">
        <slot name="legend" />

        <FilterPreview
          v-if="showPreview && filter"
          v-model="filter"
        />
      </template>
    </ClientOnly>
  </div>

  <ClientOnly>
    <FilterDrawer
      v-if="filter"
      v-model="opened"
      :filter="filter"
      @save="save"
      @reset="reset"
    />
  </ClientOnly>
</template>
