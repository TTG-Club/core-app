<script setup lang="ts">
  const previewOpened = ref(false);

  function changePreviewVisibility(value: boolean) {
    previewOpened.value = value;
  }
</script>

<template>
  <div class="sticky bottom-0 z-20 col-span-full">
    <div
      class="flex justify-end gap-2 border-t border-default bg-default/95 px-4 py-3 backdrop-blur"
    >
      <template v-if="$slots.preview">
        <UButton
          variant="soft"
          @click.left.exact.prevent="previewOpened = true"
        >
          Предварительный просмотр
        </UButton>

        <slot
          name="preview"
          :opened="previewOpened"
          :change-visibility="changePreviewVisibility"
        />
      </template>

      <UButton type="submit"> Сохранить </UButton>
    </div>
  </div>
</template>
