<script setup lang="ts">
  import type { SpeciesLinkResponse } from '~/shared/types';

  type LineageSelectItem = {
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

  const { data, status, refresh } = await useAsyncData<LineageSelectItem[]>(
    'species-lineages-select',
    async () => {
      const speciesLinks = await $fetch<Array<SpeciesLinkResponse>>(
        '/api/v2/species/lineages',
        { method: 'get' },
      );

      return speciesLinks.map((species) => ({
        label: species.name.rus,
        value: species.url,
        description: species.name.eng,
        source: species.source.name.label,
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
    :placeholder="`Выбери происхождени${multiple ? 'я' : 'е'}`"
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
