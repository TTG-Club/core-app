<script setup lang="ts">
  import { Dictionaries } from '~/shared/api';
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
    'dictionaries-sizes',
    () => Dictionaries.sizes(),
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
    placeholder="Выбери размер"
    max-tag-count="responsive"
    show-arrow
    show-search
    @dropdown-visible-change="handleDropdownOpening"
  />
</template>
