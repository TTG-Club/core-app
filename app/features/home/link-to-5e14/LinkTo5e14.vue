<script setup lang="ts">
  import { HomeEyebrow } from '~home/ui-kit';

  import { LEGACY_SITE } from './model';
</script>

<template>
  <NuxtLink
    :to="LEGACY_SITE.url"
    :class="[
      $style.card,
      'group relative flex min-h-28 flex-col justify-end gap-1.5 overflow-hidden',
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

      <p class="flex items-center gap-1.5 text-sm text-white/75">
        {{ LEGACY_SITE.description }}

        <UIcon
          name="tabler:external-link"
          class="size-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
        />
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

      opacity: 0.45;
      background-image: url('/s3/home/legacy-site.webp');
      background-repeat: no-repeat;
      background-position: center;
      background-size: cover;

      transition: transform 250ms ease;
    }

    &:after {
      content: '';

      position: absolute;
      inset: 0;

      display: block;

      background: linear-gradient(
        to top,
        rgb(10 12 16 / 88%) 0%,
        rgb(10 12 16 / 55%) 100%
      );
    }

    &:hover {
      border-color: var(--ui-border-accented);

      &:before {
        transform: scale(1.08);
      }
    }
  }
</style>
