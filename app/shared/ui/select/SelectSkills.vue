<script setup lang="ts">
  import { Form } from 'ant-design-vue';

  import { DictionaryService } from '~/shared/api';

  const { limit = 0 } = defineProps<{
    disabled?: boolean;
    limit?: number;
  }>();

  const context = Form.useInjectFormItemContext();

  const model = defineModel<Array<string>>();

  const { data, refresh } = await useAsyncData(
    'dictionaries-skills',
    () => DictionaryService.skills(),
    { dedupe: 'defer' },
  );

  const options = computed(() => {
    if (!data.value) return [];

    const disabled = !!model.value && !!limit && model.value.length >= limit;

    return data.value.map((skill) => ({
      ...skill,
      disabled: disabled && !model.value?.includes(skill.value),
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
    placeholder="Выбери два навыка"
    max-tag-count="responsive"
    mode="multiple"
    show-search
    allow-clear
    show-arrow
    @dropdown-visible-change="handleDropdownOpening"
  />
</template>
