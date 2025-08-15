<script setup lang="ts">
  import { SmallLink } from '../link';
</script>

<template>
  <SmallLink>
    <template #icon>
      <USkeleton class="size-4 rounded-full bg-elevated" />
    </template>

    <template #default>
      <USkeleton class="h-4 w-full bg-elevated" />
    </template>

    <template #caption>
      <USkeleton class="h-4 w-24 bg-elevated" />
    </template>
  </SmallLink>
</template>
