<script setup lang="ts">
  import type { SpellLinkResponse } from '~/shared/types';

  defineProps<Pick<SpellLinkResponse, 'ritual' | 'concentration'>>();
</script>

<template>
  <div
    v-if="concentration || ritual"
    class="flex gap-1"
  >
    <UBadge
      v-if="concentration"
      variant="subtle"
      color="neutral"
      size="sm"
    >
      К
    </UBadge>

    <UBadge
      v-if="ritual"
      variant="subtle"
      color="neutral"
      size="sm"
    >
      Р
    </UBadge>
  </div>
</template>
