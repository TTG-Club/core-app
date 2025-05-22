<script setup lang="ts">
  const { preview = false } = defineProps<{
    preview?: boolean;
  }>();

  const model = defineModel<boolean | null>({ required: true });

  const color = computed(() => {
    if (model.value === true) {
      return 'var(--color-success)';
    }

    if (model.value === false) {
      return 'var(--color-error)';
    }

    return 'default';
  });

  function getNextValue() {
    if (preview) {
      return null;
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
  <ATag
    v-if="!preview || model !== null"
    :class="$style.tag"
    :bordered="false"
    :color
    @click.left.exact.prevent="onClick"
  >
    <slot />
  </ATag>
</template>

<style module lang="scss">
  .tag {
    cursor: pointer;
    user-select: none;

    overflow: hidden;

    max-width: 100%;
    margin: 0;

    text-overflow: ellipsis;

    @include media-min($lg) {
      &:hover:not(:active) {
        filter: brightness(93%);
      }

      &:active {
        filter: brightness(73%);
      }
    }
  }
</style>
