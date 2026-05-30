<script setup lang="ts">
  import {
    CAROUSEL_CARDS,
    VTTG_CAROUSEL_HEADING,
    VTTG_HERO_BACKGROUND,
    VTTG_HERO_CONTENT,
    VTTG_HERO_LINKS,
    VTTG_HERO_VIDEO,
  } from '../model';
  import VttgSectionHeading from './VttgSectionHeading.vue';
  import VttgVideoPlayer from './VttgVideoPlayer.vue';
</script>

<template>
  <div class="vttg-hero relative isolate overflow-hidden">
    <!-- Cinematic backdrop -->
    <div
      class="vttg-hero__backdrop"
      aria-hidden="true"
    >
      <img
        :src="VTTG_HERO_BACKGROUND"
        alt=""
        class="vttg-hero__image"
      />

      <div class="vttg-hero__glow" />

      <div class="vttg-hero__vignette" />

      <div class="vttg-hero__fade" />
    </div>

    <!-- First screen -->
    <section
      class="relative z-10 flex min-h-[88svh] flex-col items-center justify-center px-6 py-24 text-center"
    >
      <h1
        class="vttg-hero__title vttg-hero__anim vttg-hero__anim--1 text-6xl leading-[1.15] font-bold tracking-widest text-highlighted md:text-8xl lg:text-[110px]"
      >
        {{ VTTG_HERO_CONTENT.titleLead }}<br />

        <span class="vttg-hero__accent">{{
          VTTG_HERO_CONTENT.titleAccent
        }}</span>
      </h1>

      <USeparator
        class="vttg-hero__anim vttg-hero__anim--2 mx-auto mt-8 max-w-xs"
        :ui="{ border: 'border-[oklch(0.828_0.189_84.429)]/40' }"
      >
        <UIcon
          name="tabler:diamond"
          class="size-5 text-[oklch(0.828_0.189_84.429)]"
        />
      </USeparator>

      <p
        class="vttg-hero__anim vttg-hero__anim--3 mt-8 max-w-2xl text-lg text-toned sm:text-xl"
      >
        {{ VTTG_HERO_CONTENT.descriptionLead }}<br />
        {{ VTTG_HERO_CONTENT.descriptionTrail }}
      </p>

      <div
        class="vttg-hero__anim vttg-hero__anim--4 mt-10 flex flex-wrap items-center justify-center gap-4"
      >
        <UButton
          v-for="link in VTTG_HERO_LINKS"
          :key="link.label"
          v-bind="link"
          :class="[
            'vttg-hero-button',
            link.color === 'primary'
              ? 'vttg-hero-button--primary'
              : 'vttg-hero-button--support',
          ]"
        />
      </div>

      <UIcon
        name="tabler:chevron-down"
        class="vttg-hero__scroll absolute bottom-8 left-1/2 size-7 -translate-x-1/2 text-[oklch(0.828_0.189_84.429)]/70"
        aria-hidden="true"
      />
    </section>

    <!-- Magic mirror: product video peeking into the first screen -->
    <section class="relative z-20 -mt-16 pb-20 sm:-mt-24">
      <div class="mx-auto px-6 lg:max-w-330 lg:px-8">
        <div class="vttg-hero__mirror relative rounded-2xl">
          <div class="overflow-hidden rounded-2xl">
            <VttgVideoPlayer
              :src="VTTG_HERO_VIDEO"
              :poster="VTTG_HERO_BACKGROUND"
            />
          </div>

          <span class="vttg-hero__corner vttg-hero__corner--tl" />

          <span class="vttg-hero__corner vttg-hero__corner--tr" />

          <span class="vttg-hero__corner vttg-hero__corner--bl" />

          <span class="vttg-hero__corner vttg-hero__corner--br" />
        </div>
      </div>
    </section>

    <!-- Carousel -->
    <section class="relative z-10 pb-20">
      <div class="mx-auto px-6 lg:max-w-330 lg:px-8">
        <VttgSectionHeading :title="VTTG_CAROUSEL_HEADING.title" />

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
            class="mx-2 flex h-full w-full flex-col transition duration-300 hover:ring-[oklch(0.828_0.189_84.429)]/50 md:mx-4"
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

<style scoped>
  .vttg-hero {
    --vttg-gold: oklch(0.828 0.189 84.429);
  }

  /* ── Cinematic backdrop ─────────────────────────────── */
  .vttg-hero__backdrop {
    position: absolute;
    z-index: 0;
    inset: 0;
  }

  .vttg-hero__image {
    width: 100%;
    height: 100%;

    opacity: 0.45;
    object-fit: cover;
    object-position: center;
  }

  /* Warm radial light behind the title */
  .vttg-hero__glow {
    position: absolute;
    inset: 0;
    background: radial-gradient(
      60% 50% at 50% 30%,
      color-mix(in oklch, var(--vttg-gold) 18%, transparent),
      transparent 70%
    );
  }

  /* Darken the edges to focus the centre */
  .vttg-hero__vignette {
    position: absolute;
    inset: 0;
    background: radial-gradient(
      120% 90% at 50% 38%,
      transparent 55%,
      var(--ui-bg) 100%
    );
  }

  /* Dissolve top and bottom into the page background */
  .vttg-hero__fade {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to bottom,
      color-mix(in oklch, var(--ui-bg) 65%, transparent) 0%,
      transparent 22%,
      transparent 55%,
      var(--ui-bg) 100%
    );
  }

  /* ── Title ──────────────────────────────────────────── */
  .vttg-hero__title {
    text-shadow: 0 2px 30px rgb(0 0 0 / 55%);
  }

  .vttg-hero__accent {
    color: var(--vttg-gold);
    text-shadow:
      0 4px 16px rgb(0 0 0 / 20%),
      0 2px 8px rgb(0 0 0 / 25%),
      0 0 32px color-mix(in oklch, var(--vttg-gold) 20%, transparent);
  }

  /* ── Magic-mirror video frame ───────────────────────── */
  .vttg-hero__mirror {
    box-shadow:
      0 0 0 1px color-mix(in oklch, var(--vttg-gold) 30%, transparent),
      0 24px 60px -12px rgb(0 0 0 / 70%),
      0 0 70px -24px color-mix(in oklch, var(--vttg-gold) 45%, transparent);
  }

  .vttg-hero__corner {
    position: absolute;

    width: 22px;
    height: 22px;
    border: 2px solid var(--vttg-gold);

    opacity: 0.65;
  }

  .vttg-hero__corner--tl {
    top: -2px;
    left: -2px;

    border-right: none;
    border-bottom: none;
    border-top-left-radius: 1rem;
  }

  .vttg-hero__corner--tr {
    top: -2px;
    right: -2px;

    border-bottom: none;
    border-left: none;
    border-top-right-radius: 1rem;
  }

  .vttg-hero__corner--bl {
    bottom: -2px;
    left: -2px;

    border-top: none;
    border-right: none;
    border-bottom-left-radius: 1rem;
  }

  .vttg-hero__corner--br {
    right: -2px;
    bottom: -2px;

    border-top: none;
    border-left: none;
    border-bottom-right-radius: 1rem;
  }

  /* ── Entrance & idle motion ─────────────────────────── */
  @keyframes vttg-hero-rise {
    from {
      transform: translateY(16px);
      opacity: 0;
    }

    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .vttg-hero__anim {
    opacity: 0;
    animation: vttg-hero-rise 0.7s cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
  }

  .vttg-hero__anim--1 {
    animation-delay: 0.05s;
  }

  .vttg-hero__anim--2 {
    animation-delay: 0.2s;
  }

  .vttg-hero__anim--3 {
    animation-delay: 0.35s;
  }

  .vttg-hero__anim--4 {
    animation-delay: 0.5s;
  }

  @keyframes vttg-hero-bounce {
    0%,
    100% {
      transform: translate(-50%, 0);
    }

    50% {
      transform: translate(-50%, 6px);
    }
  }

  .vttg-hero__scroll {
    animation: vttg-hero-bounce 2s ease-in-out infinite;
  }

  /* ── Buttons ────────────────────────────────────────── */
  .vttg-hero-button {
    border-radius: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Override Nuxt UI default primary button styling */
  .vttg-hero-button--primary {
    color: var(--ui-bg) !important;
    background: var(--vttg-gold) !important;
    box-shadow: 0 4px 14px
      color-mix(in oklch, var(--vttg-gold) 30%, transparent) !important;
  }

  .vttg-hero-button--primary:hover {
    transform: translateY(-2px);
    background: color-mix(
      in oklch,
      var(--vttg-gold) 90%,
      var(--ui-text-highlighted)
    ) !important;
    box-shadow: 0 6px 20px
      color-mix(in oklch, var(--vttg-gold) 50%, transparent) !important;
  }

  .vttg-hero-button--primary:active {
    transform: translateY(0);
  }

  /* Override Nuxt UI default secondary/neutral button styling */
  .vttg-hero-button--support {
    border: 1px solid color-mix(in oklch, var(--vttg-gold) 35%, transparent) !important;

    color: var(--vttg-gold) !important;

    background: color-mix(
      in oklch,
      var(--vttg-gold) 10%,
      transparent
    ) !important;
    backdrop-filter: blur(8px);
    box-shadow: 0 4px 12px
      color-mix(in oklch, var(--vttg-gold) 10%, transparent) !important;
  }

  .vttg-hero-button--support:hover {
    transform: translateY(-2px);

    border-color: var(--vttg-gold) !important;

    color: var(--ui-text-highlighted) !important;

    background: color-mix(
      in oklch,
      var(--vttg-gold) 20%,
      transparent
    ) !important;
    box-shadow: 0 0 20px color-mix(in oklch, var(--vttg-gold) 25%, transparent) !important;
  }

  .vttg-hero-button--support:active {
    transform: translateY(0);
  }

  @media (prefers-reduced-motion: reduce) {
    .vttg-hero__anim,
    .vttg-hero__scroll {
      opacity: 1;
      animation: none;
    }
  }
</style>
