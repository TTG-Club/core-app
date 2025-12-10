<template>
  <NuxtLink
    :class="[
      'relative flex flex-col gap-3 overflow-hidden rounded-lg border p-6 no-underline shadow-lg',
      'before:absolute before:top-0 before:left-0 before:block before:h-full before:w-full',
      'before:bg-[url(\'/s3/home/RoadMapBanner.webp\')] before:bg-cover before:bg-center before:bg-no-repeat',
      'before:opacity-40 before:transition-transform before:duration-200',
      'hover:before:scale-115',
    ]"
    :style="{
      borderColor: 'var(--ui-border)',
      color: 'var(--ui-text)',
      backgroundColor: 'var(--ui-bg-muted)',
    }"
    target="_blank"
    to="../roadmap"
  >
    <span class="relative z-10 text-2xl">Дорожная карта</span>

    <p class="relative z-10">Выбор за тобой!</p>
  </NuxtLink>
</template>
