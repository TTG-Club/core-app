<script setup lang="ts">
  import {
    VTTG_HERO_BACKGROUND,
    VTTG_SUBSCRIBE_BUTTON,
    VTTG_SUBSCRIPTION_FACTS,
    VTTG_SUBSCRIPTION_HERO,
    VTTG_SUBSCRIPTION_PERKS_BUTTON,
    VTTG_SUBSCRIPTION_PERKS_SECTION_ID,
    VTTG_SUBSCRIPTION_PRICE,
  } from '../model';

  // id узора уникален для экземпляра: при одинаковых id все svg на странице
  // ссылались бы на первый узор в DOM.
  const patternId = `subscription-price-pattern-${useId()}`;
  const patternFill = `url(#${patternId})`;

  const { scrollToAnchor } = useAnchorScroll();

  /** Плавно прокручивает страницу к списку привилегий. */
  function handlePerksClick() {
    scrollToAnchor(VTTG_SUBSCRIPTION_PERKS_SECTION_ID);
  }
</script>

<template>
  <section class="relative isolate overflow-hidden border-b border-default">
    <div
      class="absolute inset-0 -z-10"
      aria-hidden="true"
    >
      <img
        :src="VTTG_HERO_BACKGROUND"
        alt=""
        class="size-full object-cover opacity-30"
      />

      <div
        class="absolute inset-0 bg-linear-to-b from-default/40 via-default/80 to-default"
      />
    </div>

    <div
      class="mx-auto grid max-w-330 items-center gap-10 px-4 pt-16 pb-12 sm:px-6 md:pt-24 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16 lg:px-8"
    >
      <div class="flex min-w-0 flex-col items-start gap-6">
        <UBadge
          :label="VTTG_SUBSCRIPTION_HERO.badge"
          :icon="VTTG_SUBSCRIPTION_HERO.icon"
          color="primary"
          variant="subtle"
          size="lg"
        />

        <h1
          class="text-4xl leading-tight font-bold text-highlighted sm:text-5xl lg:text-6xl"
        >
          {{ VTTG_SUBSCRIPTION_HERO.titleLead }}<br />

          <span class="text-primary">
            {{ VTTG_SUBSCRIPTION_HERO.titleAccent }}
          </span>
        </h1>

        <p class="max-w-2xl text-lg leading-relaxed text-toned">
          {{ VTTG_SUBSCRIPTION_HERO.description }}
        </p>

        <div class="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <UButton
            v-bind="VTTG_SUBSCRIPTION_PERKS_BUTTON"
            class="justify-center"
            @click.left.exact.prevent="handlePerksClick"
          />

          <UButton
            v-bind="VTTG_SUBSCRIBE_BUTTON"
            class="justify-center"
          />
        </div>
      </div>

      <!--
        Карточка цены целиком статична: градиент и узор — неподвижные слои без
        анимации и размытия фона, браузер рисует их один раз.
      -->
      <div
        class="relative mx-auto w-full max-w-sm overflow-hidden rounded-2xl bg-elevated ring ring-default lg:w-sm"
      >
        <div
          class="pointer-events-none absolute inset-0 bg-linear-to-br from-primary/25 via-primary/5 to-transparent"
          aria-hidden="true"
        />

        <svg
          class="pointer-events-none absolute inset-0 size-full text-primary opacity-5"
          aria-hidden="true"
        >
          <defs>
            <pattern
              :id="patternId"
              width="32"
              height="32"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M16 2 30 16 16 30 2 16Z"
                fill="none"
                stroke="currentColor"
                stroke-width="0.75"
              />

              <path
                d="M16 12.5 17 15 19.5 16 17 17 16 19.5 15 17 12.5 16 15 15Z"
                fill="currentColor"
              />
            </pattern>
          </defs>

          <rect
            width="100%"
            height="100%"
            :fill="patternFill"
          />
        </svg>

        <div class="relative flex flex-col items-start gap-4 p-8">
          <UBadge
            :label="VTTG_SUBSCRIPTION_HERO.priceCaption"
            :icon="VTTG_SUBSCRIPTION_HERO.icon"
            color="primary"
            variant="subtle"
            size="lg"
          />

          <div class="flex items-baseline gap-2">
            <span
              class="text-6xl/none font-bold text-highlighted sm:text-7xl/none"
            >
              {{ VTTG_SUBSCRIPTION_PRICE.amount }}
            </span>

            <span class="text-4xl/none font-bold text-primary">
              {{ VTTG_SUBSCRIPTION_PRICE.currency }}
            </span>

            <span class="text-base text-muted">
              {{ VTTG_SUBSCRIPTION_PRICE.cycle }}
            </span>
          </div>

          <span class="text-sm font-medium text-primary">
            {{ VTTG_SUBSCRIPTION_PRICE.perDay }}
          </span>

          <USeparator />

          <p class="max-w-60 text-sm leading-relaxed text-toned">
            {{ VTTG_SUBSCRIPTION_HERO.priceHint }}
          </p>
        </div>
      </div>
    </div>

    <ul
      class="mx-auto grid max-w-330 grid-cols-1 gap-4 px-4 pb-12 sm:grid-cols-3 sm:px-6 md:pb-16 lg:px-8"
    >
      <li
        v-for="fact in VTTG_SUBSCRIPTION_FACTS"
        :key="fact.title"
        class="flex items-center gap-3 rounded-xl border border-default bg-default/60 p-4"
      >
        <span
          class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10"
        >
          <UIcon
            :name="fact.icon"
            class="size-5 text-primary"
          />
        </span>

        <div class="min-w-0">
          <p class="font-semibold text-highlighted">
            {{ fact.title }}
          </p>

          <p class="text-sm text-muted">
            {{ fact.description }}
          </p>
        </div>
      </li>
    </ul>
  </section>
</template>
