<script setup lang="ts">
  import type { FeatureItem, VideoExtension } from '../model';

  import { VIDEO_EXTENSIONS } from '../model';

  const props = defineProps<{
    feature: FeatureItem;
    fill?: boolean;
  }>();

  const isVideoSource = computed(() =>
    VIDEO_EXTENSIONS.some((extension: VideoExtension) =>
      props.feature.img.endsWith(extension),
    ),
  );

  const wrapperClass = computed(() =>
    props.fill ? 'aspect-video lg:aspect-auto lg:h-full' : 'aspect-video',
  );
</script>

<template>
  <div
    class="relative w-full overflow-hidden"
    :class="wrapperClass"
  >
    <video
      v-if="isVideoSource"
      :src="feature.img"
      autoplay
      loop
      muted
      playsinline
      class="size-full object-cover transition-transform duration-500 group-hover:scale-105"
    />

    <img
      v-else
      :src="feature.img"
      :alt="feature.title"
      class="size-full object-cover transition-transform duration-500 group-hover:scale-105"
    />

    <span
      class="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[oklch(0.828_0.189_84.429)]/60 to-transparent"
    />
  </div>
</template>
