<script setup lang="ts">
  import { Form } from 'ant-design-vue';

  import { DictionaryService } from '~/shared/api';

  const { mode = undefined, limit = 0 } = defineProps<{
    disabled?: boolean;
    limit?: number;
    mode?: 'multiple' | 'tags';
  }>();

  const context = Form.useInjectFormItemContext();

  const model = defineModel<string | Array<string>>();

  const { data, refresh } = await useAsyncData(
    'dictionaries-skills',
    () => DictionaryService.skills(),
    { dedupe: 'defer' },
  );

  const isMultiple = computed(() => Boolean(mode));

  const options = computed(() => {
    if (!data.value) return [];

    if (!isMultiple.value) {
      return data.value;
    }

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

  const placeholder = computed(() => {
    if (!isMultiple.value) {
      return 'Выбери навык';
    }

    if (!limit) {
      return 'Выбери навыки';
    }

    const plural = getPlural(limit, ['навык', 'навыка', 'навыков']);

    return `Выбери ${limit} ${plural}`;
  });
</script>

<template>
  <ASelect
    v-model:value="model"
    :options="options"
    max-tag-count="responsive"
    :placeholder
    :mode
    show-search
    allow-clear
    show-arrow
    @dropdown-visible-change="handleDropdownOpening"
  />
</template>
