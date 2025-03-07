<script setup lang="ts">
  import type { SpellLinkResponse } from '~/shared/types';

  defineProps<Pick<SpellLinkResponse, 'components'>>();
</script>

<template>
  <AFlex
    :class="$style.components"
    :gap="4"
  >
    <span :class="$style.component">
      {{ components.v ? 'В' : '·' }}
    </span>

    <span :class="$style.component">
      {{ components.s ? 'С' : '·' }}
    </span>

    <span :class="$style.component">
      {{ components.m ? 'М' : '·' }}
    </span>
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
