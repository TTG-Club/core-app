<script setup lang="ts">
  const open = ref(false);
</script>

<template>
  <div class="mt-[3dvw] flex w-1/2 flex-col items-center">
    <UButton
      class="rounded-full"
      variant="subtle"
      color="neutral"
      size="xl"
      disabled
      block
      @click.left.exact.prevent="open = true"
    >
      <span class="text-sm"
        >Нажмите тут или <UKbd value="\">\</UKbd> для начала поиска</span
      >
    </UButton>

    <UModal v-model:open="open">
      <template #content>
        <UCommandPalette />
      </template>
    </UModal>
  </div>
</template>
