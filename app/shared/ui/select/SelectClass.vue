<script setup lang="ts">
  import type { ClassLinkResponse } from '~classes/model';

  const { multiple = false, disabled } = defineProps<{
    disabled?: boolean;
    multiple?: boolean;
  }>();

  const model = defineModel<string | Array<string>>();

  const search = shallowRef('');
  const searchQuery = refDebounced(search, 250);

  const fetchKey = computed(() => {
    let key = 'class-select';

    if (searchQuery.value) {
      key += `-${searchQuery.value}`;
    }

    return key;
  });

  const { data, status, refresh } = await useAsyncData(
    fetchKey,
    async () => {
      const classesLinks = await $fetch<Array<ClassLinkResponse>>(
        '/api/v2/classes/search',
        {
          method: 'post',
          query: {
            query: searchQuery.value || undefined,
          },
        },
      );

      return classesLinks.map((classLink) => ({
        label: classLink.name.rus,
        value: classLink.url,
        description: classLink.name.eng,
        source: classLink.source.name.label,
      }));
    },
    {
      watch: [searchQuery],
      dedupe: 'defer',
      lazy: true,
    },
  );

  const handleDropdownOpening = useDebounceFn(async (state: boolean) => {
    if (!state) {
      return;
    }

    await refresh();
  }, 250);
</script>

<template>
  <USelectMenu
    v-model="model"
    v-model:search-term="search"
    :loading="status === 'pending'"
    :items="data"
    :multiple="multiple"
    :disabled="disabled"
    :placeholder="`Выбери класс${multiple ? 'ы' : ''}`"
    label-key="label"
    value-key="value"
    ignore-filter
    clearable
    searchable
    :ui="{ itemDescription: 'text-xs text-secondary' }"
    @update:open="handleDropdownOpening"
  >
    <template #item-trailing="{ item }">
      <UBadge
        variant="subtle"
        color="neutral"
      >
        {{ item.source }}
      </UBadge>
    </template>
  </USelectMenu>
</template>
