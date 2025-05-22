<script setup lang="ts">
  import { Form } from 'ant-design-vue';

  import { Dictionaries } from '~/shared/api';

  defineProps<{
    disabled?: boolean;
  }>();

  const context = Form.useInjectFormItemContext();

  const model = defineModel<number>();

  const { data, status, refresh } = await useAsyncData(
    'dictionaries-challengeRating',
    () => Dictionaries.challengeRating(),
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
      label="Показатель опасности"
      :name="['immunityToDamage']"
    >
      <ASelect
        v-model:value="model"
        :loading="status === 'pending'"
        :options="data || []"
        :disabled
        placeholder="Выбери показатель опасности"
        show-search
        show-arrow
        @dropdown-visible-change="handleDropdownOpening"
      />
    </AFormItem>
  </ACol>
</template>
