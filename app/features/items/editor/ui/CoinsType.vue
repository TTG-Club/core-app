<script setup lang="ts">
  import { Form } from 'ant-design-vue';

  import { DictionaryService } from '~/shared/api';

  defineProps<{
    disabled?: boolean;
  }>();

  const context = Form.useInjectFormItemContext();

  const model = defineModel<string>();

  const { data, status, refresh } = await useAsyncData(
    'dictionaries-coins-type',
    () => DictionaryService.coinType(),
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
  <AFormItem
    label="Номинал монет"
    tooltip="Выберите номинал"
    :name="['coin']"
  >
    <ASelect
      v-model:value="model"
      :loading="status === 'pending'"
      :options="data || []"
      :disabled
      placeholder="Выбери типы"
      show-search
      @dropdown-visible-change="handleDropdownOpening"
    />
  </AFormItem>
</template>
