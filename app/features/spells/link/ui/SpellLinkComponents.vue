<script setup lang="ts">
  import type { SpellLinkResponse } from '~spells/model';

  defineProps<Pick<SpellLinkResponse, 'components'>>();
</script>

<template>
  <span class="ml-auto inline-flex gap-1">
    <span class="w-3 text-center">
      {{ components.v ? 'В' : '·' }}
    </span>

    <span class="w-3 text-center">
      {{ components.s ? 'С' : '·' }}
    </span>

    <span class="w-3 text-center">
      {{ components.m ? 'М' : '·' }}
    </span>
  </span>
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
