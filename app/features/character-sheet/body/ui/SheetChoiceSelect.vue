<script setup lang="ts">
  const {
    count,
    items,
    placeholder = '',
  } = defineProps<{
    items: string[];
    count: number;
    placeholder?: string;
  }>();

  const model = defineModel<string[]>({ default: () => [] });

  // Выбор одного значения — одиночный селект: один клик сразу переключает выбор
  // (в множественном пришлось бы снимать старый и ставить новый). Несколько —
  // множественный селект.
  const isMultiple = computed(() => count > 1);

  const singleValue = computed<string | undefined>({
    get: () => model.value[0],
    set: (value) => {
      model.value = value ? [value] : [];
    },
  });
</script>

<template>
  <USelectMenu
    v-if="isMultiple"
    v-model="model"
    :items="items"
    :placeholder="placeholder"
    multiple
    searchable
  />

  <USelectMenu
    v-else
    v-model="singleValue"
    :items="items"
    :placeholder="placeholder"
    searchable
  />
</template>
