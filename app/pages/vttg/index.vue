<script lang="ts">
  import type { VideoExtension } from './constants';

  import {
    CAROUSEL_CARDS,
    FAQ_ITEMS,
    FEATURE_ITEMS,
    VIDEO_EXTENSIONS,
    VTTG_HERO_BACKGROUND,
    VTTG_HERO_LINKS,
    VTTG_SEO,
  } from './constants';
</script>

<script setup lang="ts">
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

  definePageMeta({
    layout: 'vttg',
  });

  useSeoMeta({
    title: VTTG_SEO.title,
    description: VTTG_SEO.description,
  });
</script>

<template>
  <NuxtLayout>
    <UPage>
      <!-- Общая фоновая картинка для hero + carousel -->
      <div class="relative overflow-hidden">
        <img
          :src="VTTG_HERO_BACKGROUND"
          alt="Virtual TTG Club"
          class="absolute inset-0 size-full object-cover object-center opacity-20"
        />

        <UPageHero
          class="relative z-10"
          :links="VTTG_HERO_LINKS"
        >
          <template #headline>
            <UBadge
              variant="subtle"
              class="rounded-full"
            >
              <UIcon
                name="tabler:sparkles"
                class="mr-2 size-4"
              />
              Открытая demo — уже скора
            </UBadge>
          </template>

          <template #title>
            <span
              class="inline-block text-6xl leading-[1.3] tracking-widest drop-shadow-[8px_8px_8px_rgba(0,0,0,0.4)] md:text-8xl lg:text-[110px]"
            >
              Virtual<br />

              <span class="text-[oklch(0.828_0.189_84.429)]">TTG Club</span>
            </span>
          </template>

          <template #description>
            Полноценный виртуальный стол для D&amp;D 5e. <br />
            Карты, кубики, персонажи — всё в одном месте.
          </template>
        </UPageHero>

        <section class="relative z-10 pb-20">
          <div class="mx-auto px-6 lg:max-w-330 lg:px-8">
            <div class="mb-12 text-center">
              <h2 class="text-3xl font-bold text-highlighted md:text-4xl">
                Всё для идеальной игровой сессии
              </h2>
            </div>

            <UCarousel
              v-slot="{ item }"
              :items="CAROUSEL_CARDS"
              arrows
              loop
              autoplay
              class-names
              class="mx-auto w-full pb-2 lg:max-w-330"
              :ui="{
                container: 'items-stretch py-2',
                item: 'flex basis-[90%] md:basis-[80%] lg:basis-[70%] transition-opacity duration-300 [&:not(.is-snapped)]:opacity-40',
              }"
            >
              <UCard
                class="mx-2 flex w-full flex-col md:mx-4"
                :ui="{ body: 'p-0 sm:p-0 flex-1 flex flex-col' }"
              >
                <div
                  class="relative h-64 w-full shrink-0 overflow-hidden rounded-t-xl sm:h-80 lg:h-96"
                >
                  <img
                    :src="item.img"
                    :alt="item.title"
                    class="size-full object-cover"
                  />
                </div>

                <div class="flex flex-1 flex-col gap-4 p-6 md:p-8">
                  <div class="flex items-center gap-3">
                    <UIcon
                      :name="item.icon"
                      class="size-8 shrink-0 text-primary"
                    />

                    <h3 class="text-2xl font-bold text-highlighted">
                      {{ item.title }}
                    </h3>
                  </div>

                  <p class="text-sm leading-relaxed text-toned">
                    {{ item.description }}
                  </p>
                </div>
              </UCard>
            </UCarousel>
          </div>
        </section>
      </div>

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

              <h3 class="text-3xl font-bold text-highlighted">
                И многое другое
              </h3>

              <p class="mx-auto mt-4 max-w-2xl text-lg text-toned">
                Система плейлистов, готовая система пресетов звуковых эффектов,
                система освещения, система заклинаний, автоматизация и многое
                другое.
              </p>
            </div>
          </UPageGrid>
        </div>
      </section>

      <section class="border-y border-default bg-elevated">
        <div class="mx-auto px-6 py-20 lg:max-w-330 lg:px-8">
          <div class="mb-12 text-center">
            <h2 class="text-3xl font-bold text-highlighted md:text-4xl">
              Частые вопросы
            </h2>

            <p class="mt-3 text-toned">
              Всё, что нужно знать перед первой игрой
            </p>
          </div>

          <UAccordion
            :items="FAQ_ITEMS"
            size="xl"
            class="w-full [&_button]:py-5 [&_button_span]:text-xl [&_button_span]:font-medium [&_p]:text-lg"
          />
        </div>
      </section>

      <section class="py-28">
        <div class="mx-auto px-6 text-center lg:max-w-330 lg:px-8">
          <h2 class="text-3xl font-bold text-highlighted md:text-5xl">
            Поддержите проект
          </h2>

          <p class="mx-auto mt-5 max-w-2xl text-lg text-toned">
            Ваша поддержка поможет нам полностью реализовать продукт и сделать
            его лучше и масштабнее для всех игроков.
          </p>

          <div class="mt-10 flex flex-wrap items-center justify-center gap-4">
            <UButton
              size="xl"
              icon="tabler:heart"
              label="Поддержать проект"
              color="primary"
              @click.left.exact.prevent
            />
          </div>
        </div>
      </section>
    </UPage>
  </NuxtLayout>
</template>
