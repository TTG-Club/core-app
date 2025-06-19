<script setup lang="ts">
  import type { SpellLinkResponse } from '~/shared/types';

  defineProps<Pick<SpellLinkResponse, 'components'>>();
</script>

<template>
  <div class="ml-auto flex gap-1">
    <span class="w-3 text-center">
      {{ components.v ? 'В' : '·' }}
    </span>

    <span class="w-3 text-center">
      {{ components.s ? 'С' : '·' }}
    </span>

    <span class="w-3 text-center">
      {{ components.m ? 'М' : '·' }}
    </span>
  </div>
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
