<script setup lang="ts">
  import { Form } from 'ant-design-vue';

  import type { FeatLinkResponse } from '~/shared/types';

  const { multiple = false } = defineProps<{
    disabled?: boolean;
    multiple?: boolean;
  }>();

  const context = Form.useInjectFormItemContext();

  const model = defineModel<string | Array<string>>();

  const searchQuery = ref('');

  const { data, status, refresh } = await useAsyncData(
    'feat-select',
    async () => {
      const featLinks = await $fetch<Array<FeatLinkResponse>>(
        '/api/v2/feats/search',
        {
          method: 'post',
          params: {
            query: searchQuery.value || undefined,
          },
        },
      );

      return featLinks.map((feat) => ({
        label: `${feat.name.rus} [${feat.name.eng}]`,
        value: feat.url,
      }));
    },
    {
      watch: [searchQuery],
      dedupe: 'defer',
    },
  );

  const handleDropdownOpening = (state: boolean) => {
    if (!state) {
      return;
    }

    refresh();
  };

  const handleSearch = (value: string) => {
    searchQuery.value = value;
  };

  watch(model, () => {
    context.onFieldChange();
  });
</script>

<template>
  <ASelect
    v-model:value="model"
    :loading="status === 'pending'"
    :options="data || []"
    :mode="multiple ? 'multiple' : undefined"
    :filter-option="false"
    :disabled
    placeholder="Выбери черту"
    max-tag-count="responsive"
    show-search
    allow-clear
    show-arrow
    @dropdown-visible-change="handleDropdownOpening"
    @search="handleSearch"
  />
</template>
