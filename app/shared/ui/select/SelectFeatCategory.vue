<script setup lang="ts">
  import { Dictionaries } from '~/shared/api';
  import { Form } from 'ant-design-vue';

  defineProps<{
    disabled?: boolean;
  }>();

  const context = Form.useInjectFormItemContext();

  const model = defineModel<string>();

  const { data, status, refresh } = await useAsyncData(
    'dictionaries-feat-categories',
    () => Dictionaries.featCategories(),
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
    :disabled
    placeholder="Выбери категорию черты"
    show-search
    allow-clear
    show-arrow
    @dropdown-visible-change="handleDropdownOpening"
  />
</template>
