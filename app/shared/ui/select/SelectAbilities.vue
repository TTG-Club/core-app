<script setup lang="ts">
  import { Form } from 'ant-design-vue';

  import { Dictionaries } from '~/shared/api';

  const { limit = 0 } = defineProps<{
    disabled?: boolean;
    limit?: number;
  }>();

  const context = Form.useInjectFormItemContext();

  const model = defineModel<Array<string>>();

  const { data, refresh } = await useAsyncData('dictionaries-abilities', () =>
    Dictionaries.abilities(),
  );

  const options = computed(() => {
    if (!data.value) return [];

    const disabled = !!model.value && !!limit && model.value.length >= limit;

    return data.value.map((ability) => ({
      ...ability,
      disabled: disabled && !model.value?.includes(ability.value),
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
    :options="options"
    :token-separators="[',']"
    placeholder="Выбери характеристики"
    max-tag-count="responsive"
    mode="multiple"
    allow-clear
    show-search
    show-arrow
    @dropdown-visible-change="handleDropdownOpening"
  />
</template>
