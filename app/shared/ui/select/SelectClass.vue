<script setup lang="ts">
  import type { ClassLinkResponse } from '~classes/model';

  interface ClassSelectItem {
    description: string;
    disabled: boolean;
    label: string;
    source: string;
    value: string;
  }

  const props = withDefaults(
    defineProps<{
      disabled?: boolean;
      excludedValues?: Array<string>;
      multiple?: boolean;
    }>(),
    {
      disabled: false,
      excludedValues: () => [],
      multiple: false,
    },
  );

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

  const {
    data: classLinks,
    status,
    refresh,
  } = await useAsyncData(
    fetchKey,
    () => {
      return $fetch<Array<ClassLinkResponse>>('/api/v2/classes/search', {
        method: 'get',
        query: {
          query: searchQuery.value || undefined,
        },
      });
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

  const selectItems = computed<Array<ClassSelectItem>>(() => {
    return (classLinks.value ?? []).map((classLink) => ({
      label: classLink.name.rus,
      value: classLink.url,
      description: classLink.name.eng,
      source: classLink.source.name.label,
      disabled: props.excludedValues.includes(classLink.url),
    }));
  });
</script>

<template>
  <USelectMenu
    v-model="model"
    v-model:search-term="search"
    :loading="status === 'pending'"
    :items="selectItems"
    :multiple="props.multiple"
    :disabled="props.disabled"
    :placeholder="`Выбери класс${props.multiple ? 'ы' : ''}`"
    label-key="label"
    value-key="value"
    ignore-filter
    clearable
    searchable
    :ui="{ itemDescription: 'text-xs text-secondary' }"
    @update:open="handleDropdownOpening"
  >
    <template #item-trailing="{ item: classItem }">
      <UBadge
        variant="subtle"
        color="neutral"
      >
        {{ classItem.source }}
      </UBadge>
    </template>
  </USelectMenu>
</template>
