<script setup lang="ts">
  const { preview = false, exclude = false } = defineProps<{
    preview?: boolean;
    exclude?: boolean;
  }>();

  const model = defineModel<boolean | null>({ required: true });

  const color = computed(() => {
    if (!model.value) {
      return 'neutral';
    }

    return exclude ? 'error' : 'primary';
  });

  function getNextValue() {
    if (preview) {
      return null;
    }

    return model.value ? null : true;
  }

  function onClick() {
    model.value = getNextValue();
  }
</script>

<template>
  <UBadge
    v-if="!preview || model !== null"
    class="max-w-full cursor-pointer justify-center overflow-hidden overflow-ellipsis select-none hover:brightness-93 active:brightness-83"
    :class="!preview ? 'min-w-8' : undefined"
    :variant="model ? 'solid' : 'subtle'"
    :size="!preview ? 'md' : undefined"
    :color
    @click.left.exact.prevent="onClick"
  >
    <slot />
  </UBadge>
</template>
