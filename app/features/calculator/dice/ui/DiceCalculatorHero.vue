<script setup lang="ts">
  import { HomeEyebrow } from '~home/ui-kit';

  import {
    DICE_CALCULATOR_TITLE,
    DICE_HERO_LABELS,
    DICE_ICONS,
  } from '../model';
</script>

<template>
  <header
    class="flex flex-col gap-2 rounded-xl border border-default bg-muted px-4 py-5 sm:gap-3 sm:px-6 sm:py-7"
    :class="$style.hero"
  >
    <HomeEyebrow
      :label="DICE_HERO_LABELS.eyebrow"
      :icon="DICE_ICONS.hero"
    />

    <h1
      class="font-display text-3xl leading-none font-bold text-highlighted sm:text-4xl lg:text-5xl"
    >
      {{ DICE_CALCULATOR_TITLE }}
    </h1>

    <p class="max-w-2xl text-sm text-pretty text-muted sm:text-base">
      {{ DICE_HERO_LABELS.lead }}
    </p>
  </header>
</template>

<style module lang="scss">
  .hero {
    background-image:
      radial-gradient(
        70% 160% at 100% 0%,
        color-mix(in oklab, var(--ui-primary) 16%, transparent),
        transparent 70%
      ),
      linear-gradient(
        180deg,
        transparent 60%,
        color-mix(in oklab, var(--ui-primary) 5%, transparent)
      );
  }
</style>
