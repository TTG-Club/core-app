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
    'dictionaries-heal-types',
    () => Dictionaries.healTypes(),
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
    :placeholder="`Выбери тип${multiple ? 'ы' : ''} лечения`"
    :mode="multiple ? 'multiple' : undefined"
    :loading="status === 'pending'"
    :options="data || []"
    max-tag-count="responsive"
    show-search
    show-arrow
    @dropdown-visible-change="handleDropdownOpening"
  />
</template>
