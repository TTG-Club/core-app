<script setup lang="ts">
  const previewOpened = ref(false);

  function changePreviewVisibility(value: boolean) {
    previewOpened.value = value;
  }
</script>

<template>
  <div class="col-span-full flex justify-end gap-2">
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
</template>
