<script setup lang="ts">
  import { ref, useTemplateRef } from 'vue';

  const props = defineProps<{
    src: string;
    poster?: string;
  }>();

  // Флаг «плеер уже запускали»: после первого клика по Play нативные контролы
  // остаются видимыми всегда, а не только во время воспроизведения. Иначе при
  // перемотке (браузер ставит видео на паузу на время перетаскивания ползунка)
  // контролы бы прятались, а поверх всплывала большая кнопка Play.
  const hasStarted = ref(false);
  const videoRef = useTemplateRef<HTMLVideoElement>('video');

  function handlePlayClick() {
    if (!videoRef.value) {
      return;
    }

    hasStarted.value = true;
    videoRef.value.play();
  }
</script>

<template>
  <div class="group relative aspect-video w-full bg-black">
    <video
      ref="video"
      :src="props.src"
      :poster="props.poster"
      preload="auto"
      :controls="hasStarted"
      controlsList="nodownload noplaybackrate"
      playsinline
      class="size-full object-cover"
    />

    <!-- Overlay с кнопкой Play (только до первого запуска) -->
    <div
      v-if="!hasStarted"
      class="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/40 transition-colors hover:bg-black/50"
      @click="handlePlayClick"
    >
      <UButton
        icon="tabler:player-play-filled"
        size="xl"
        color="primary"
        variant="solid"
        class="flex size-16 scale-100 items-center justify-center rounded-full shadow-2xl transition-transform group-hover:scale-110"
        :ui="{ leadingIcon: 'size-8 ml-1' }"
      />
    </div>
  </div>
</template>
