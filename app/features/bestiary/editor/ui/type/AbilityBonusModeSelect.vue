<script setup lang="ts">
  const props = defineProps<{
    modelValue: 0 | 1 | 2;
  }>();

  const emit = defineEmits<{
    (e: 'update:modelValue', value: 0 | 1 | 2): void;
  }>();

  const internalValue = computed(() => props.modelValue ?? -1);

  const options = [
    { label: '𐤏', value: 0 },
    { label: '◐', value: 1 },
    { label: '𒊹', value: 2 },
  ];

  function update(value: unknown) {
    if (typeof value === 'number') {
      emit('update:modelValue', value as 0 | 1 | 2);
    }
  }
</script>

<template>
  <ASelect
    :value="internalValue"
    :options="options"
    :dropdown-match-select-width="false"
    @update:value="update"
  />
</template>
