<script setup lang="ts">
  import { Form } from 'ant-design-vue';

  import type { SpeciesLinkResponse } from '~/shared/types';

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

  const { data, status, refresh } = await useAsyncData(
    'species-select',
    async () => {
      const speciesLinks = await $fetch<Array<SpeciesLinkResponse>>(
        '/api/v2/species/search',
        {
          method: 'post',
        },
      );

      return speciesLinks.map((species) => ({
        label: `${species.name.rus} [${species.name.eng}]`,
        value: species.url,
      }));
    },
  );

  const handleDropdownOpening = (state: boolean) => {
    if (!state) {
      return;
    }

    refresh();
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
    placeholder="Выбери вид"
    max-tag-count="responsive"
    show-search
    allow-clear
    show-arrow
    @dropdown-visible-change="handleDropdownOpening($event)"
  />
</template>
