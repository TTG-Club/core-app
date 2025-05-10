<script setup lang="ts">
  import { Form } from 'ant-design-vue';

  import { Dictionaries } from '~/shared/api';

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
    'dictionaries-rarity',
    () => Dictionaries.rarity(),
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
    placeholder="Выбери редкость"
    show-search
    show-arrow
    @dropdown-visible-change="handleDropdownOpening"
  />
</template>
