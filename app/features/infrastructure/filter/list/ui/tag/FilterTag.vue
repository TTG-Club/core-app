<script setup lang="ts">
  const { preview = false, type = 'filter' } = defineProps<{
    preview?: boolean;
    type?: 'filter' | 'singleton';
  }>();

  const model = defineModel<boolean | null>({ required: true });

  const color = computed(() => {
    if (type === 'filter') {
      return model.value ? 'primary' : 'neutral';
    }

    if (model.value === true) {
      return 'success';
    }

    if (model.value === false) {
      return 'error';
    }

    return 'neutral';
  });

  function getNextValue() {
    if (preview) {
      return null;
    }

    if (type === 'filter') {
      return model.value ? null : true;
    }

    switch (model.value) {
      case null:
        return true;
      case true:
        return false;
      case false:
        return null;
      default:
        return null;
    }
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
