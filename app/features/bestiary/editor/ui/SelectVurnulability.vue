<script setup lang="ts">
  import { Form } from 'ant-design-vue';

  import { Dictionaries } from '~/shared/api';

  defineProps<{
    disabled?: boolean;
  }>();

  const context = Form.useInjectFormItemContext();

  const model = defineModel<Array<string>>();

  const { data, status, refresh } = await useAsyncData(
    'dictionaries-beast-vulnerabilities',
    () => Dictionaries.damageTypes(),
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
  <ACol :span="8">
    <AFormItem
      label="Уязвимость к урону"
      :name="['vulnerabilities']"
    >
      <ASelect
        v-model:value="model"
        mode="multiple"
        :loading="status === 'pending'"
        :options="data || []"
        :disabled
        placeholder="Выбери урон"
        show-search
        show-arrow
        @dropdown-visible-change="handleDropdownOpening"
      />
    </AFormItem>
  </ACol>
</template>
