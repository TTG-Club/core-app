<script setup lang="ts">
  defineProps<{
    placeholder?: string;
  }>();

  const model = defineModel<Array<string>>();

  const tags = ref<Array<string>>([]);

  const options = computed(() =>
    tags.value.map((tag) => ({
      label: tag,
      value: tag,
    })),
  );

  // const updateTags = (value: SelectValue) => {
  //   if (!value || !(isString(value) || isArray(value))) {
  //     return;
  //   }
  //
  //   const collection = chain(isString(value) ? [value] : value)
  //     .filter(isString)
  //     .map(trim)
  //     .union()
  //     .value();
  //
  //   tags.value.push(...difference(collection, tags.value));
  // };
</script>

<template>
  <USelect
    v-model="model"
    :items="options"
    :token-separators="[',']"
    :placeholder
    multiple
  />
</template>
