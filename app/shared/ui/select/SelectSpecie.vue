<script setup lang="ts">
  import type { SpecieLinkResponse } from '~/shared/types';
  import { Form } from 'ant-design-vue';

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
      const specieLinks = await $fetch<Array<SpecieLinkResponse>>(
        '/api/v2/species/search',
        {
          method: 'post',
        },
      );

      return specieLinks.map((specie) => ({
        label: `${specie.name.rus} [${specie.name.eng}]`,
        value: specie.url,
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
