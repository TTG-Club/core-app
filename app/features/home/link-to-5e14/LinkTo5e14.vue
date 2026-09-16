<script setup lang="ts">
  import { HomeEyebrow } from '~home/ui-kit';

  import { LEGACY_SITE } from './model';
</script>

<template>
  <NuxtLink
    :to="LEGACY_SITE.url"
    :class="[
      $style.card,
      'relative flex min-h-28 flex-col justify-end gap-1.5 overflow-hidden',
      'rounded-xl border border-default bg-muted p-4 text-white no-underline',
    ]"
    target="_blank"
  >
    <div class="relative z-10 flex flex-col gap-1.5">
      <HomeEyebrow
        :label="LEGACY_SITE.eyebrow"
        class="text-white/60"
      />

      <h2 class="text-2xl leading-none font-semibold text-white">
        {{ LEGACY_SITE.title }}
      </h2>

      <p class="text-sm text-white/75">
        {{ LEGACY_SITE.description }}
      </p>
    </div>
  </NuxtLink>
</template>

<style lang="scss" module>
  .card {
    transition: border-color 200ms ease;

    &:before {
      content: '';

      position: absolute;
      inset: 0;

      display: block;

      opacity: 0.24;
      background-image: url('/s3/home/legacy-site.webp');
      background-repeat: no-repeat;
      background-position: center;
      background-size: cover;
      filter: grayscale(1) brightness(0.85);

      transition:
        transform 250ms ease,
        opacity 250ms ease,
        filter 250ms ease;
    }

    &:after {
      content: '';

      position: absolute;
      inset: 0;

      display: block;

      background: linear-gradient(
        to top,
        rgb(10 12 16 / 78%) 0%,
        rgb(10 12 16 / 30%) 100%
      );
    }

    &:hover {
      border-color: var(--ui-border-accented);

      &:before {
        transform: scale(1.08);
        opacity: 0.5;
        filter: grayscale(0) brightness(1);
      }
    }
  }
</style>
