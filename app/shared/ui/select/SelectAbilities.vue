<script setup lang="ts">
  import { Form } from 'ant-design-vue';

  import { DictionaryService } from '~/shared/api';

  const { multiple = false, limit = 0 } = defineProps<{
    disabled?: boolean;
    multiple?: boolean;
    limit?: number;
  }>();

  const context = Form.useInjectFormItemContext();

  const model = defineModel<string | Array<string>>();

  const { data, refresh } = await useAsyncData(
    'dictionaries-abilities',
    () => DictionaryService.abilities(),
    { dedupe: 'defer' },
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
