<script setup lang="ts">
  import type { VttgHeading } from '../model';

  defineProps<VttgHeading>();
</script>

<template>
  <div class="mb-12 text-center">
    <h2 class="text-3xl font-bold tracking-wide text-highlighted md:text-4xl">
      {{ title }}
    </h2>

    <USeparator
      class="mx-auto mt-6 max-w-xs"
      :ui="{ border: 'border-[oklch(0.828_0.189_84.429)]/40' }"
    >
      <UIcon
        name="tabler:diamond"
        class="size-5 text-[oklch(0.828_0.189_84.429)]"
      />
    </USeparator>

    <p
      v-if="subtitle"
      class="mx-auto mt-6 max-w-2xl text-lg text-toned"
    >
      {{ subtitle }}
    </p>
  </div>
</template>
