<script setup lang="ts">
  const model = defineModel<0 | 1 | 2>({ required: true });

  const { state, next } = useCycleList<0 | 1 | 2>([0, 1, 2], {
    initialValue: model,
  });

  syncRef(model, state);

  const css = useCssModule();

  const dotClass = computed(() => {
    const classes: Array<string> = [css.dot];

    if (state.value > 0) {
      classes.push(css.proficiency);
    }

    if (state.value > 1) {
      classes.push(css.expertise);
    }

    return classes;
  });
</script>

<template>
  <div
    :class="$style.mastery"
    @click.left.exact.prevent="next()"
  >
    <div :class="dotClass" />

    <slot name="default" />
  </div>
</template>

<style module lang="scss">
  .mastery {
    cursor: pointer;
    user-select: none;

    display: flex;
    gap: 8px;
    align-items: center;
  }

  .dot {
    cursor: pointer;
    content: '';

    display: flex;
    align-items: center;
    justify-content: center;

    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: {
      width: 1px;
      color: var(--ui-text);

      style: solid;
    }

    &:after {
      content: '';

      display: block;

      border-radius: 50%;

      opacity: 0;
      background: var(--ui-text);
    }

    &.proficiency {
      border-style: hidden;

      &:after {
        width: 8px;
        height: 8px;
        opacity: 1;
      }
    }

    &.expertise {
      border-style: solid;
      &:after {
        width: 6px;
        height: 6px;
      }
    }
  }
</style>
