<script setup lang="ts">
  import { VTTG_PROMO_CARD } from './model';
</script>

<template>
  <NuxtLink
    :to="VTTG_PROMO_CARD.to"
    :class="[
      'vttg-promo group relative flex min-h-44 flex-col justify-end',
      'overflow-hidden rounded-lg border border-default bg-muted p-4',
      'no-underline shadow-lg',
    ]"
  >
    <!-- Фон и затемнение -->
    <div class="absolute inset-0 z-0 select-none">
      <img
        :src="VTTG_PROMO_CARD.backgroundImage"
        alt=""
        aria-hidden="true"
        class="vttg-promo__bg size-full object-cover object-center"
      />

      <div class="vttg-promo__overlay absolute inset-0" />
    </div>

    <div class="relative z-10 flex flex-col items-start gap-1.5">
      <span class="text-[10px] font-bold tracking-wider text-primary uppercase">
        {{ VTTG_PROMO_CARD.eyebrow }}
      </span>

      <h3 class="text-lg leading-tight font-bold text-white">
        {{ VTTG_PROMO_CARD.title }}
      </h3>

      <p class="text-sm leading-snug text-white/70">
        {{ VTTG_PROMO_CARD.description }}
      </p>

      <span
        class="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-primary"
      >
        {{ VTTG_PROMO_CARD.linkLabel }}

        <UIcon
          :name="VTTG_PROMO_CARD.linkIcon"
          class="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
        />
      </span>
    </div>
  </NuxtLink>
</template>

<style scoped>
  .vttg-promo {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .vttg-promo:hover {
    border-color: color-mix(in oklch, var(--ui-primary) 45%, transparent);
    box-shadow:
      0 12px 30px -12px rgb(0 0 0 / 60%),
      0 0 20px -8px color-mix(in oklch, var(--ui-primary) 30%, transparent);
  }

  .vttg-promo__bg {
    opacity: 0.85;
    transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .vttg-promo:hover .vttg-promo__bg {
    transform: scale(1.05);
  }

  /* Два слоя: горизонтальный держит контраст под текстом, вертикальный
     затемняет низ карточки и стыкует её с фоном страницы. */
  .vttg-promo__overlay {
    background:
      linear-gradient(
        to right,
        rgb(0 0 0 / 88%) 0%,
        rgb(0 0 0 / 62%) 65%,
        rgb(0 0 0 / 30%) 100%
      ),
      linear-gradient(to top, rgb(0 0 0 / 70%) 0%, rgb(0 0 0 / 15%) 100%);
  }
</style>
