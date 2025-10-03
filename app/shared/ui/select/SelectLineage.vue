<script setup lang="ts">
  import type { SpeciesLinkResponse } from '~/shared/types';
  import type { SelectMenuItem } from '#ui/components/SelectMenu.vue';

  const { multiple = false, disabled } = defineProps<{
    disabled?: boolean;
    multiple?: boolean;
  }>();

  const model = defineModel<string | Array<string>>();

  const { data, status, refresh } = await useAsyncData<SelectMenuItem[]>(
    'species-lineages-select',
    async () => {
      const speciesLinks = await $fetch<Array<SpeciesLinkResponse>>(
        '/api/v2/species/lineages',
      );

      return speciesLinks.map((species) => ({
        label: `${species.name.rus} [${species.name.eng}]`,
        value: species.url,
      }));
    },
    { dedupe: 'defer' },
  );

  const handleDropdownOpening = (state: boolean) => {
    if (!state) {
      return;
    }

    refresh();
  };
</script>

<template>
  <USelectMenu
    v-model="model"
    :loading="status === 'pending'"
    :items="data || []"
    :multiple="multiple"
    :disabled="disabled"
    :placeholder="`Выбери происхождени${multiple ? 'я' : 'е'}`"
    clearable
    searchable
    @update:open="handleDropdownOpening"
  />
</template>
