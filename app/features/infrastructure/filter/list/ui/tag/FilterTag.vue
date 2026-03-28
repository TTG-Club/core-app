<script setup lang="ts">
  const { preview = false } = defineProps<{
    preview?: boolean;
  }>();

  const model = defineModel<boolean | null>({ required: true });

  const color = computed(() => {
    return model.value ? 'primary' : 'neutral';
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
    variant="subtle"
    :size="!preview ? 'lg' : undefined"
    :color
    @click.left.exact.prevent="onClick"
  >
    <slot />
  </UBadge>
</template>
