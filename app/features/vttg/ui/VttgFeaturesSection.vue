<script setup lang="ts">
  import type { VideoExtension } from '../model';

  import { FEATURE_ITEMS, VIDEO_EXTENSIONS } from '../model';

  /**
   * Проверяет, является ли источник видеофайлом по расширению.
   *
   * @param source - путь к файлу
   * @returns `true`, если файл является видео
   */
  function isVideoSource(source: string): boolean {
    return VIDEO_EXTENSIONS.some((extension: VideoExtension) =>
      source.endsWith(extension),
    );
  }
</script>

<template>
  <section class="py-18">
    <div class="mx-auto px-6 lg:max-w-330 lg:px-8">
      <USeparator
        class="mb-16 w-full"
        :ui="{ border: 'border-[oklch(0.828_0.189_84.429)]' }"
      >
        <UIcon
          name="tabler:diamond"
          class="size-5 text-[oklch(0.828_0.189_84.429)]"
        />
      </USeparator>

      <div class="mb-16 text-center">
        <h2 class="text-3xl font-bold text-highlighted md:text-4xl">
          Мощный функционал
        </h2>

        <p class="mt-3 text-toned">
          Созданный для Мастеров, которые ценят своё время
        </p>
      </div>

      <UPageGrid class="gap-8 lg:grid-cols-3 lg:gap-12">
        <UCard
          v-for="feature in FEATURE_ITEMS"
          :key="feature.title"
          :ui="{ body: 'p-0 sm:p-0' }"
        >
          <div
            class="relative aspect-video w-full overflow-hidden rounded-t-xl"
          >
            <video
              v-if="isVideoSource(feature.img)"
              :src="feature.img"
              autoplay
              loop
              muted
              playsinline
              class="size-full object-cover"
            />

            <img
              v-else
              :src="feature.img"
              :alt="feature.title"
              class="size-full object-cover"
            />
          </div>

          <div class="flex flex-col gap-2 p-5">
            <div class="flex items-center gap-2">
              <UIcon
                :name="feature.icon"
                class="size-5 shrink-0 text-primary"
              />

              <h3 class="font-semibold text-highlighted">
                {{ feature.title }}
              </h3>
            </div>

            <p class="text-sm text-toned">
              {{ feature.description }}
            </p>
          </div>
        </UCard>

        <div
          class="col-span-full mt-4 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-12 text-center transition-colors hover:border-primary/50 hover:bg-primary/10"
        >
          <UIcon
            name="tabler:apps"
            class="mb-4 size-12 text-primary/80"
          />

          <h3 class="text-3xl font-bold text-highlighted">И многое другое</h3>

          <p class="mx-auto mt-4 max-w-2xl text-lg text-toned">
            Система плейлистов, готовая система пресетов звуковых эффектов,
            система освещения, система заклинаний, автоматизация и многое
            другое.
          </p>
        </div>
      </UPageGrid>
    </div>
  </section>
</template>
