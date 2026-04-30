<script setup lang="ts">
  import {
    CAROUSEL_CARDS,
    VTTG_HERO_BACKGROUND,
    VTTG_HERO_LINKS,
  } from '../model';
</script>

<template>
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
</template>
