<script setup lang="ts">
  const { disabled } = defineProps<{
    disabled?: boolean;
  }>();

  const model = defineModel<0 | 1 | 2>({ required: true });

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
</script>

<template>
  <USelect
    v-model="model"
    :items="levels"
    :disabled="disabled"
    placeholder="Выбери уровень владения"
    @open="handleDropdownOpening(true)"
  >
    <template
      v-if="$slots.trailing"
      #trailing
    >
      <slot name="trailing" />
    </template>
  </USelect>
</template>
