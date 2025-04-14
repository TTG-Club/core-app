<script setup lang="ts">
  import { Form } from 'ant-design-vue';

  import { Dictionaries } from '~/shared/api';

  withDefaults(
    defineProps<{
      disabled?: boolean;
      multiple?: boolean;
    }>(),
    {
      disabled: false,
      multiple: false,
    },
  );

  const context = Form.useInjectFormItemContext();

  const model = defineModel<string | Array<string>>();

  const { data, status, refresh } = await useAsyncData(
    'dictionaries-range-types',
    () => Dictionaries.rangeTypes(),
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
    :disabled
    placeholder="Выбери единицу дистанции"
    max-tag-count="responsive"
    show-search
    show-arrow
    allow-clear
    @dropdown-visible-change="handleDropdownOpening"
  />
</template>
