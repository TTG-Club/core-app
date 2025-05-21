<script setup lang="ts">
  import { Form } from 'ant-design-vue';

  import { Dictionaries } from '~/shared/api';

  defineProps<{
    disabled?: boolean;
  }>();

  const context = Form.useInjectFormItemContext();

  const model = defineModel<string>();

  const { data, status, refresh } = await useAsyncData(
    'dictionaries-beast-aligned',
    () => Dictionaries.alignments(),
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
  <ACol :span="4">
    <AFormItem
      label="Мирровозрение существа"
      :name="['alignment']"
    >
      <ASelect
        v-model:value="model"
        :loading="status === 'pending'"
        :options="data || []"
        :disabled
        placeholder="Выбери мирровозрение существа"
        show-search
        show-arrow
        @dropdown-visible-change="handleDropdownOpening"
      />
    </AFormItem>
  </ACol>
</template>
