<script setup lang="ts">
  import { Form } from 'ant-design-vue';

  import { Dictionaries } from '~/shared/api';

  defineProps<{
    disabled?: boolean;
  }>();

  const context = Form.useInjectFormItemContext();

  const model = defineModel<Array<string>>();

  const { data, refresh } = await useAsyncData(
    'dictionaries-magic-items-category',
    () => Dictionaries.magicItemCategory(),
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
    :options="data || []"
    :token-separators="[',']"
    max-tag-count="responsive"
    @dropdown-visible-change="handleDropdownOpening"
  />
</template>
