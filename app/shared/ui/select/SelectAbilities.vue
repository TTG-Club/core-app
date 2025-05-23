<script setup lang="ts">
  import { Form } from 'ant-design-vue';

  import { Dictionaries } from '~/shared/api';

  const { limit = 0 } = defineProps<{
    multiple?: boolean;
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
    :placeholder="`Выбери характеристик${multiple ? 'и' : 'у'}`"
    :mode="multiple ? 'multiple' : undefined"
    :token-separators="[',']"
    :options="options"
    max-tag-count="responsive"
    allow-clear
    show-search
    show-arrow
    @dropdown-visible-change="handleDropdownOpening"
  />
</template>
