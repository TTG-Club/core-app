<script setup lang="ts">
  import { Form } from 'ant-design-vue';
  import { trim, isString } from 'lodash-es';
  import { ref, watch } from 'vue';

  import type { SelectValue } from 'ant-design-vue/es/select';
  import type { DefaultOptionType } from 'ant-design-vue/es/vc-select/Select';

  defineProps<{
    placeholder?: string;
  }>();

  const context = Form.useInjectFormItemContext();

  const model = defineModel<string>();

  const options = ref<DefaultOptionType[]>([]);

  const onSearch = (searchText: string) => {
    const trimmed = trim(searchText);

    if (!trimmed) {
      options.value = [];

      return;
    }

    if (!options.value.some((opt) => opt.value === trimmed)) {
      options.value = [{ label: trimmed, value: trimmed }];
    }
  };

  const onSelect = (value: SelectValue) => {
    if (isString(value)) {
      const trimmed = trim(value);

      model.value = trimmed;

      if (!options.value.some((opt) => opt.value === trimmed)) {
        options.value.push({ label: trimmed, value: trimmed });
      }
    }
  };

  watch(model, () => {
    context?.onFieldChange?.();
  });
</script>

<template>
  <AAutoComplete
    v-model:value="model"
    :options="options"
    :placeholder="placeholder || 'Введите значение'"
    @select="onSelect"
    @search="onSearch"
  />
</template>
