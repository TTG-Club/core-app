<script setup lang="ts">
  import type { ClassLinkResponse } from '~classes/types';

  type SubclassSelectItem = {
    label: string;
    value: string;
    description: string;
    source: string;
  };

  const { multiple = false, disabled } = defineProps<{
    disabled?: boolean;
    multiple?: boolean;
  }>();

  const model = defineModel<string | Array<string>>();

  const openedOnce = ref(false);

  const { data, status, refresh } = await useAsyncData<SubclassSelectItem[]>(
    'subclasses-select',
    async () => {
      const classesLinks = await $fetch<Array<ClassLinkResponse>>(
        '/api/v2/classes/subclasses',
        { method: 'get' },
      );

      return classesLinks.map((classLink) => ({
        label: classLink.name.rus,
        value: classLink.url,
        description: classLink.name.eng,
        source: classLink.source.name.label,
      }));
    },
    {
      immediate: false,
      default: () => [],
      dedupe: 'defer',
    },
  );

  const items = computed(() => data.value ?? []);

  const handleDropdownOpening = async (state: boolean) => {
    if (!state) {
      return;
    }

    if (!openedOnce.value) {
      openedOnce.value = true;
      await refresh();
    }
  };
</script>

<template>
  <USelectMenu
    v-model="model"
    :loading="status === 'pending'"
    :items="items"
    :multiple="multiple"
    :disabled="disabled"
    :placeholder="`Выбери подкласс${multiple ? 'ы' : ''}`"
    label-key="label"
    value-key="value"
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
