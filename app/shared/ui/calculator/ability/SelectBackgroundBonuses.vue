<script setup lang="ts">
  import SelectBackground from '~ui/select/SelectBackground.vue';

  const backgroundUrl = defineModel<string | undefined>('backgroundUrl');

  const handleClear = () => {
    backgroundUrl.value = undefined;
  };
</script>

<template>
  <div class="w-full sm:max-w-sm">
    <label
      class="mb-2 flex items-center justify-between gap-3 text-sm font-semibold"
    >
      Предыстория
    </label>

    <div class="flex gap-2">
      <div class="flex-1">
        <SelectBackground
          v-model="backgroundUrl"
          placeholder="Выбрать"
        />
      </div>

      <UButton
        v-if="backgroundUrl"
        icon="i-ttg-x"
        variant="soft"
        color="neutral"
        size="sm"
        @click.left.exact.prevent="handleClear"
      />
    </div>
  </div>
</template>
