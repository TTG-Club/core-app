<script setup lang="ts">
  import { Form } from 'ant-design-vue';

  import { DictionaryService } from '~/shared/api';

  defineProps<{
    disabled?: boolean;
  }>();

  const context = Form.useInjectFormItemContext();

  const model = defineModel<string>();

  const { data, status, refresh } = await useAsyncData(
    'dictionaries-comparison-operators',
    () => DictionaryService.comparisonOperators(),
    { dedupe: 'defer' },
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
    placeholder="Выбери тип цены"
    show-search
    allow-clear
    show-arrow
    @dropdown-visible-change="handleDropdownOpening"
  />
</template>
