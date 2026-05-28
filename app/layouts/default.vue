<script setup lang="ts">
  import { AppFooter } from '~infrastructure/footer';
</script>

<template>
  <div class="flex min-h-dvh w-full flex-col">
    <div
      class="mx-auto flex min-h-dvh w-full flex-col lg:max-w-330 lg:flex-row"
    >
      <div class="min-h-dvh flex-auto px-4 pb-8 lg:pt-4">
        <slot name="default" />
      </div>
    </div>

    <AppFooter />
  </div>
</template>
