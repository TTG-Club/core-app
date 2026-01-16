<script setup lang="ts">
  import type { SelectOptionWithShortName, SourceLink } from '~/shared/types';

  const { multiple = false, disabled } = defineProps<{
    disabled?: boolean;
    multiple?: boolean;
  }>();

  const model = defineModel<string | Array<string>>();

  const { data, status, refresh } = await useAsyncData<
    Array<SelectOptionWithShortName>
  >(
    'sources',
    async () => {
      const sourceLinks = await $fetch<Array<SourceLink>>(
        '/api/v2/source/search',
        {
          method: 'post',
        },
      );

      return sourceLinks.map((source) => ({
        label: `${source.name.rus} [${source.name.eng}]`,
        value: source.url,
        shortName: source.name.label,
      }));
    },
    { dedupe: 'defer' },
  );

  function handleDropdownOpening(state: boolean) {
    if (!state) {
      return;
    }

    refresh();
  }
</script>

<template>
  <USelectMenu
    v-model="model"
    :loading="status === 'pending'"
    :items="data || []"
    :multiple="multiple"
    :disabled="disabled"
    placeholder="Выбери книгу"
    label-key="label"
    value-key="value"
    searchable
    clearable
    @open="handleDropdownOpening(true)"
  />
</template>
