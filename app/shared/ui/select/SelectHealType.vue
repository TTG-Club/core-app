<script
  setup
  lang="ts"
  generic="T extends boolean, U extends T extends true ? Array<string> : string"
>
  import { Form } from 'ant-design-vue';

  import { DictionaryService } from '~/shared/api';

  const { multiple = false } = defineProps<{
    disabled?: boolean;
    multiple?: T;
  }>();

  const context = Form.useInjectFormItemContext();

  const model = defineModel<U>();

  const { data, status, refresh } = await useAsyncData(
    'dictionaries-heal-types',
    () => DictionaryService.healTypes(),
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
    :placeholder="`Выбери тип${multiple ? 'ы' : ''} лечения`"
    :mode="multiple ? 'multiple' : undefined"
    :loading="status === 'pending'"
    :options="data || []"
    max-tag-count="responsive"
    show-search
    show-arrow
    @dropdown-visible-change="handleDropdownOpening"
  />
</template>
