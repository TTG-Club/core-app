<script setup lang="ts">
  import { useGlobalSearch } from '~search/composable';
  import { SourceTag } from '~ui/source-tag';
  import { getPathBySearchItem, getTypeNameBySearchItem } from './model';
  import type { GlobalSearchRes, SearchItemsType } from './model';
  import { groupBy } from 'lodash-es';

  const { isOpen, close } = useGlobalSearch();

  const searchTerm = shallowRef('');
  const searchQuery = refDebounced(searchTerm, 700);

  const { data, status } = await useAsyncData(
    computed(() => `full-text-search-${searchQuery.value}`),
    () =>
      $fetch<GlobalSearchRes>('/api/v2/full-text-search', {
        params: {
          query:
            searchQuery.value && searchQuery.value.length >= 1
              ? searchQuery.value
              : undefined,
        },
      }),
    {
      watch: [searchQuery],
      deep: false,
      default: () => ({
        items: [],
        total: 0,
        filtered: 0,
      }),
    },
  );

  const groups = computed(() => {
    if (!data.value?.items?.length) {
      return [];
    }

    const grouped = groupBy(data.value.items, (item) => item.type);

    return Object.entries(grouped).map(([id, group]) => ({
      id,
      label: getTypeNameBySearchItem(id as SearchItemsType),
      ignoreFilter: true,
      items: group.map((item) => ({
        label: item.name.rus,
        suffix: item.name.eng ? `[${item.name.eng}]` : undefined,
        source: item.source,
        to: `/${getPathBySearchItem(item.type)}/${item.url}`,
      })),
    }));
  });

  const isLoading = computed(() => status.value === 'pending');

  function onClose() {
    searchTerm.value = '';

    close();
  }
</script>

<template>
  <UModal
    :open="isOpen"
    :class="[
      'top-16 translate-y-0',
      'max-h-[calc(100dvh-var(--spacing)*32)]',
      'sm:max-h-[calc(100dvh-var(--spacing)*32)]',
    ]"
    @close="onClose"
  >
    <template #content>
      <UCommandPalette
        v-model:open="isOpen"
        v-model:search-term="searchTerm"
        placeholder="Введите запрос..."
        :loading="isLoading"
        :groups
        :ui="{
          footer: 'p-2',
        }"
        @update:model-value="onClose"
      >
        <template #item-trailing="{ item }">
          <SourceTag :source="item.source" />
        </template>

        <template #footer>
          <div class="flex items-center justify-between gap-2 text-xs">
            <span class="text-secondary">
              Показано {{ data.filtered }} из {{ data.total }}
            </span>
          </div>
        </template>
      </UCommandPalette>
    </template>
  </UModal>
</template>
