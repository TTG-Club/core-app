<script setup lang="ts">
  import { Form } from 'ant-design-vue';
  import { chain, difference, isArray, isString, trim } from 'lodash-es';

  import type { SelectValue } from 'ant-design-vue/es/select';
  import type { DefaultOptionType } from 'ant-design-vue/es/vc-select/Select';

  defineProps<{
    placeholder?: string;
  }>();

  const context = Form.useInjectFormItemContext();

  const model = defineModel<Array<string>>();

  const tags = ref<Array<string>>([]);

  const options = computed<Array<DefaultOptionType>>(() =>
    tags.value.map((tag) => ({
      label: tag,
      value: tag,
    })),
  );

  const updateTags = (value: SelectValue) => {
    if (!value || !(isString(value) || isArray(value))) {
      return;
    }

    const collection = chain(isString(value) ? [value] : value)
      .filter(isString)
      .map(trim)
      .union()
      .value();

    tags.value.push(...difference(collection, tags.value));
  };

  watch(model, () => {
    context.onFieldChange();
  });
</script>

<template>
  <ASelect
    v-model:value="model"
    :options="options"
    :token-separators="[',']"
    :placeholder
    max-tag-count="responsive"
    mode="tags"
    @change="updateTags"
  />
</template>
