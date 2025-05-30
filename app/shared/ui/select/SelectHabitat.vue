<script setup lang="ts">
  import { Form } from 'ant-design-vue';

  import { DictionaryService } from '~/shared/api';

  const { multiple = false } = defineProps<{
    disabled?: boolean;
    multiple?: boolean;
  }>();

  const context = Form.useInjectFormItemContext();

  const model = defineModel<string | Array<string>>();

  const { data, status, refresh } = await useAsyncData(
    'dictionaries-habitats',
    () => DictionaryService.habitats(),
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
    :placeholder="`Выбери сред${multiple ? 'ы' : 'у'} обитания`"
    :mode="multiple ? 'multiple' : undefined"
    :loading="status === 'pending'"
    :options="data || []"
    :disabled
    max-tag-count="responsive"
    show-search
    show-arrow
    @dropdown-visible-change="handleDropdownOpening"
  />
</template>
