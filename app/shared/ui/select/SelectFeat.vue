<script setup lang="ts">
  import { Form } from 'ant-design-vue';

  import type { FeatLinkResponse } from '~/shared/types';

  withDefaults(
    defineProps<{
      multiple?: boolean;
    }>(),
    {
      multiple: false,
    },
  );

  const context = Form.useInjectFormItemContext();
  const model = defineModel<string | Array<string>>();
  const searchQuery = ref(''); // введённый текст поиска

  const { data, status, refresh } = await useAsyncData(
    'feat-select',
    async () => {
      const queryParams =
        searchQuery.value.length >= 3
          ? { query: searchQuery.value }
          : undefined;

      const featLinks = await $fetch<Array<FeatLinkResponse>>(
        '/api/v2/feats/search',
        {
          method: 'post',
          query: queryParams,
        },
      );

      return featLinks.map((feat) => ({
        label: `${feat.name.rus} [${feat.name.eng}]`,
        value: feat.url,
      }));
    },
    { watch: [searchQuery] }, // автоматически обновлять при изменении
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
    placeholder="Выбери вид"
    max-tag-count="responsive"
    show-search
    allow-clear
    show-arrow
    @dropdown-visible-change="handleDropdownOpening($event)"
    @search="handleSearch"
  />
</template>
