<script setup lang="ts">
  import { Dictionaries } from '~/shared/api';
  import { Form } from 'ant-design-vue';

  const props = withDefaults(
    defineProps<{
      multiple?: boolean;
      disabledKeys?: Array<string>;
    }>(),
    {
      multiple: false,
      disabledKeys: () => [],
    },
  );

  const context = Form.useInjectFormItemContext();

  const model = defineModel<string | Array<string>>();

  const { data, status, refresh } = await useAsyncData(
    'dictionaries-sizes',
    () => Dictionaries.sizes(),
  );

  const options = computed(() => {
    if (!data.value?.length) {
      return [];
    }

    return data.value.map((size) => ({
      ...size,
      disabled: props.disabledKeys.includes(size.value),
    }));
  });

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
    :options="options"
    :mode="multiple ? 'multiple' : undefined"
    :placeholder="`Выбери размер${multiple ? 'ы' : ''}`"
    max-tag-count="responsive"
    show-arrow
    show-search
    @dropdown-visible-change="handleDropdownOpening"
  />
</template>
