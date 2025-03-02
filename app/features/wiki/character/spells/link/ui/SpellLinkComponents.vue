<script setup lang="ts">
  import type { SpellLink } from '~/shared/types';

  defineProps<Pick<SpellLink, 'components'>>();
</script>

<template>
  <AFlex
    :class="$style.components"
    :gap="4"
  >
    <ATooltip
      :mouse-enter-delay="0.7"
      title="Вербальный компонент"
      destroy-tooltip-on-hide
    >
      <span :class="$style.component">
        {{ components.v ? 'В' : '·' }}
      </span>
    </ATooltip>

    <ATooltip
      :mouse-enter-delay="0.7"
      title="Соматический компонент"
      destroy-tooltip-on-hide
    >
      <span :class="$style.component">
        {{ components.s ? 'С' : '·' }}
      </span>
    </ATooltip>

    <ATooltip
      :mouse-enter-delay="0.7"
      title="Материальный компонент"
      destroy-tooltip-on-hide
    >
      <span :class="$style.component">
        {{ components.m ? 'М' : '·' }}
      </span>
    </ATooltip>
  </AFlex>
</template>

<style module lang="scss">
  .components {
    margin-left: auto;
  }

  .component {
    width: 12px;
    text-align: center;
  }
</style>
