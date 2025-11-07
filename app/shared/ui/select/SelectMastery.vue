<script setup lang="ts">
  const { disabled } = defineProps<{
    disabled?: boolean;
  }>();

  const model = defineModel<0 | 1 | 2>({
    default: 1,
  });

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
</script>

<template>
  <USelect
    v-model="model"
    :items="levels"
    :disabled="disabled"
    placeholder="Выбери уровень владения"
  >
    <template
      v-if="$slots.trailing"
      #trailing
    >
      <slot name="trailing" />
    </template>
  </USelect>
</template>
