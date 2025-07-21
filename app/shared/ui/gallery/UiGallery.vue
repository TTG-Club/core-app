<script setup lang="ts">
  const {
    preview,
    images = [],
    alt = '',
  } = defineProps<{
    preview: string;
    images?: Array<string>;
    alt?: string;
  }>();

  const items = computed(() => {
    if (!images.length) {
      return [preview];
    }

    return [preview, ...images];
  });

  const active = computed(() => items.value.length > 1);
</script>

<template>
  <UCarousel
    ref="carousel"
    v-slot="{ item }"
    wheel-gestures
    :active
    :items
    loop
    dots
    :ui="{
      viewport: 'rounded',
      dots: 'static mt-3',
    }"
  >
    <NuxtImg
      v-slot="{ src, isLoaded, imgAttrs }"
      :src="item"
      custom
    >
      <!-- Show the actual image when loaded -->
      <img
        v-if="isLoaded"
        v-bind="imgAttrs"
        class="aspect-square w-full object-contain"
        :src="src"
        :alt
      />

      <!-- Show a placeholder while loading -->
      <img
        v-else
        class="aspect-square w-full object-contain"
        src="https://placehold.co/400x400"
        alt="placeholder"
      />
    </NuxtImg>
  </UCarousel>
</template>
