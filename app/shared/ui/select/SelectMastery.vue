<script setup lang="ts">
  import { Form } from 'ant-design-vue';

  defineProps<{
    disabled?: boolean;
  }>();

  const context = Form.useInjectFormItemContext();

  const model = defineModel<number>();

  // const { data: levels, status, refresh } = await useAsyncData(
  //   'dictionaries-sizes',
  //   () => DictionaryService.sizes(),
  //   { dedupe: 'defer' },
  // );

  const levels = ref<
    Array<{
      label: string;
      value: 0 | 1 | 2;
    }>
  >([
    {
      label: 'Без умения',
      value: 0,
    },
    {
      label: 'С умением',
      value: 1,
    },
    {
      label: 'Компетенция',
      value: 2,
    },
  ]);

  const handleDropdownOpening = (state: boolean) => {
    if (!state) {
      return;
    }
    //
    // refresh();
  };

  watch(model, () => {
    context.onFieldChange();
  });
</script>

<template>
  <ASelect
    v-model:value="model"
    :options="levels"
    placeholder="Выбери уровень владения"
    show-arrow
    @dropdown-visible-change="handleDropdownOpening"
  />
</template>
