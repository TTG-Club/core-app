<script setup lang="ts">
  defineEmits<{
    (e: 'preview'): void;
  }>();

  const hasPreviewCallback = computed(
    () => !!getCurrentInstance()?.vnode.props?.onPreview,
  );
</script>

<template>
  <div class="col-span-full flex justify-end gap-2">
    <UButton
      v-if="hasPreviewCallback"
      variant="soft"
      @click.left.exact.prevent="$emit('preview')"
    >
      Предварительный просмотр
    </UButton>

    <UButton type="submit"> Сохранить </UButton>
  </div>
</template>
