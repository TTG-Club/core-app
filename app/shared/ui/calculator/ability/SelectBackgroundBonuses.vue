<script setup lang="ts">
  import SelectBackground from '~ui/select/SelectBackground.vue';

  const backgroundUrl = defineModel<string | undefined>('backgroundUrl', {
    default: undefined,
  });
</script>

<template>
  <div class="w-full sm:max-w-sm">
    <label
      class="mb-2 flex items-center justify-between gap-3 text-sm font-semibold"
    >
      Предыстория
    </label>

    <SelectBackground
      v-model="backgroundUrl"
      placeholder="Выбрать"
    />
  </div>
</template>
