<script setup lang="ts">
  import {
    FEATURE_ITEMS,
    VTTG_FEATURES_HEADING,
    VTTG_FEATURES_MORE,
  } from '../model';
  import VttgFeatureMedia from './VttgFeatureMedia.vue';
  import VttgSectionHeading from './VttgSectionHeading.vue';

  const [spotlightFeature, ...gridFeatures] = FEATURE_ITEMS;
</script>

<template>
  <section class="py-20">
    <div class="mx-auto px-6 lg:max-w-330 lg:px-8">
      <VttgSectionHeading
        :title="VTTG_FEATURES_HEADING.title"
        :subtitle="VTTG_FEATURES_HEADING.subtitle"
      />

      <!-- Spotlight feature -->
      <article
        v-if="spotlightFeature"
        class="vttg-spotlight group relative grid overflow-hidden rounded-2xl bg-elevated lg:grid-cols-2"
      >
        <VttgFeatureMedia
          :feature="spotlightFeature"
          fill
          class="lg:order-last"
        />

        <div class="flex flex-col justify-center gap-5 p-8 lg:p-12">
          <span
            class="flex size-12 shrink-0 items-center justify-center rounded-xl border border-[oklch(0.828_0.189_84.429)]/30 bg-[oklch(0.828_0.189_84.429)]/10"
          >
            <UIcon
              :name="spotlightFeature.icon"
              class="size-6 text-[oklch(0.828_0.189_84.429)]"
            />
          </span>

          <h3 class="text-2xl font-bold text-highlighted md:text-3xl">
            {{ spotlightFeature.title }}
          </h3>

          <p class="max-w-prose text-base leading-relaxed text-toned">
            {{ spotlightFeature.description }}
          </p>
        </div>

        <span class="vttg-corner vttg-corner--tl" />

        <span class="vttg-corner vttg-corner--tr" />

        <span class="vttg-corner vttg-corner--bl" />

        <span class="vttg-corner vttg-corner--br" />
      </article>

      <!-- Remaining features -->
      <div
        class="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:mt-8 lg:grid-cols-4 lg:gap-8"
      >
        <UCard
          v-for="feature in gridFeatures"
          :key="feature.title"
          class="group flex h-full flex-col overflow-hidden transition duration-300 hover:ring-[oklch(0.828_0.189_84.429)]/50"
          :ui="{ body: 'p-0 sm:p-0 flex flex-1 flex-col' }"
        >
          <VttgFeatureMedia :feature="feature" />

          <div class="flex flex-1 flex-col gap-2 p-5">
            <div class="flex items-center gap-2">
              <UIcon
                :name="feature.icon"
                class="size-5 shrink-0 text-[oklch(0.828_0.189_84.429)]"
              />

              <h3 class="font-semibold text-highlighted">
                {{ feature.title }}
              </h3>
            </div>

            <p class="text-sm leading-relaxed text-toned">
              {{ feature.description }}
            </p>
          </div>
        </UCard>
      </div>

      <!-- More to come -->
      <div
        class="mt-6 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-[oklch(0.828_0.189_84.429)]/30 bg-[oklch(0.828_0.189_84.429)]/5 p-10 text-center transition-colors hover:border-[oklch(0.828_0.189_84.429)]/50 lg:mt-8 lg:flex-row lg:gap-8 lg:p-12 lg:text-left"
      >
        <UIcon
          :name="VTTG_FEATURES_MORE.icon"
          class="size-12 shrink-0 text-[oklch(0.828_0.189_84.429)]/80"
        />

        <div>
          <h3 class="text-2xl font-bold text-highlighted md:text-3xl">
            {{ VTTG_FEATURES_MORE.title }}
          </h3>

          <p class="mt-3 max-w-3xl text-lg text-toned">
            {{ VTTG_FEATURES_MORE.description }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
  .vttg-spotlight {
    --vttg-gold: oklch(0.828 0.189 84.429);

    box-shadow:
      0 0 0 1px color-mix(in oklch, var(--vttg-gold) 25%, transparent),
      0 24px 60px -24px rgb(0 0 0 / 70%);
  }

  .vttg-corner {
    pointer-events: none;

    position: absolute;

    width: 22px;
    height: 22px;
    border: 2px solid var(--vttg-gold);

    opacity: 0.6;
  }

  .vttg-corner--tl {
    top: -1px;
    left: -1px;

    border-right: none;
    border-bottom: none;
    border-top-left-radius: 1rem;
  }

  .vttg-corner--tr {
    top: -1px;
    right: -1px;

    border-bottom: none;
    border-left: none;
    border-top-right-radius: 1rem;
  }

  .vttg-corner--bl {
    bottom: -1px;
    left: -1px;

    border-top: none;
    border-right: none;
    border-bottom-left-radius: 1rem;
  }

  .vttg-corner--br {
    right: -1px;
    bottom: -1px;

    border-top: none;
    border-left: none;
    border-bottom-right-radius: 1rem;
  }
</style>
