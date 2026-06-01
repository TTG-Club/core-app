<script setup lang="ts">
  import { VTTG_CAMPAIGN_BANNER } from './model';
</script>

<template>
  <div
    :class="[
      'vttg-banner',
      'relative flex w-full flex-col gap-6 overflow-hidden rounded-2xl border p-6 shadow-xl md:p-8',
      'md:flex-row md:items-center md:justify-between lg:gap-8',
    ]"
  >
    <!-- Background image and overlay -->
    <div class="absolute inset-0 z-0 select-none">
      <img
        :src="VTTG_CAMPAIGN_BANNER.backgroundImage"
        alt=""
        class="vttg-banner__bg size-full object-cover object-center opacity-85"
        aria-hidden="true"
      />

      <div class="vttg-banner__overlay absolute inset-0" />
    </div>

    <!-- Content -->
    <div class="relative z-10 flex flex-1 flex-col items-start gap-3">
      <h2 class="text-xl font-bold tracking-tight text-white md:text-2xl">
        {{ VTTG_CAMPAIGN_BANNER.title }}
      </h2>

      <p class="max-w-3xl text-xs leading-relaxed text-neutral-300 md:text-sm">
        {{ VTTG_CAMPAIGN_BANNER.description }}
      </p>
    </div>

    <!-- Actions -->
    <div
      class="relative z-10 flex shrink-0 flex-wrap items-center gap-3 sm:flex-nowrap"
    >
      <UButton
        :to="VTTG_CAMPAIGN_BANNER.moreInfoTo"
        color="neutral"
        variant="subtle"
        size="lg"
        class="w-full vttg-btn-secondary sm:w-auto"
        :style="{
          '--btn-border':
            'color-mix(in oklch, var(--vttg-gold) 35%, transparent)',
          '--btn-text': 'var(--vttg-gold)',
          '--btn-bg': 'color-mix(in oklch, var(--vttg-gold) 8%, transparent)',
        }"
      >
        Подробнее
        <template #trailing>
          <UIcon
            name="tabler:arrow-right"
            class="size-4"
          />
        </template>
      </UButton>

      <UButton
        :to="VTTG_CAMPAIGN_BANNER.linkTo"
        target="_blank"
        color="primary"
        size="lg"
        class="w-full vttg-btn-primary sm:w-auto"
        :style="{
          '--btn-bg': 'var(--vttg-gold)',
          '--btn-text': 'var(--ui-bg)',
        }"
      >
        <template #leading>
          <UIcon
            name="tabler:heart"
            class="size-4"
          />
        </template>
        Поддержать проект
      </UButton>
    </div>
  </div>
</template>

<style scoped>
  .vttg-banner {
    --vttg-gold: oklch(0.828 0.189 84.429);

    border-color: var(--ui-border);
    background-color: var(--ui-bg-muted);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .vttg-banner:hover {
    border-color: color-mix(in oklch, var(--vttg-gold) 45%, transparent);
    box-shadow:
      0 12px 30px -10px rgb(0 0 0 / 60%),
      0 0 24px -6px color-mix(in oklch, var(--vttg-gold) 25%, transparent);
  }

  .vttg-banner:hover .vttg-banner__bg {
    transform: scale(1.03);
  }

  .vttg-banner__bg {
    transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .vttg-banner__overlay {
    background: linear-gradient(
      to right,
      rgba(0, 0, 0, 0.85) 0%,
      rgba(0, 0, 0, 0.5) 60%,
      rgba(0, 0, 0, 0.15) 100%
    );
  }

  @media (max-width: 767.98px) {
    .vttg-banner__overlay {
      background: linear-gradient(
        to bottom,
        rgba(0, 0, 0, 0.95) 0%,
        rgba(0, 0, 0, 0.8) 70%,
        rgba(0, 0, 0, 0.6) 100%
      );
    }
  }
</style>
