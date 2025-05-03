<script setup lang="ts">
  const { onlyReset = false } = defineProps<{
    onlyReset?: boolean;
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

  const { state, next } = useCycleList([null, true, false], {
    initialValue: model,
  });

  function onClick() {
    if (onlyReset) {
      state.value = null;

      return;
    }

    next();
  }

  watchDebounced(
    state,
    (value, oldValue) => {
      if (value === oldValue) {
        return;
      }

      model.value = value;
    },
    { debounce: 300 },
  );
</script>

<template>
  <ATag
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
    margin: 0;

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
