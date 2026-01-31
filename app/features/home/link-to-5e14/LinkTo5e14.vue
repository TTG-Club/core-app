<template>
  <NuxtLink
    to="https://5e14.ttg.club/"
    :class="[
      'relative flex flex-1 flex-col gap-3 bg-muted p-3',
      'rounded-[10px] border border-default shadow-lg',
      'overflow-hidden text-default no-underline',
      'before:absolute before:inset-0',
      'before:block before:size-full',
      'before:bg-[url(/s3/home/legacy-site.webp)] before:opacity-40',
      'before:bg-cover before:bg-center before:bg-no-repeat',
      'before:transition-transform before:duration-200',
      'hover:before:scale-115',
    ]"
    target="_blank"
  >
    <h2
      class="relative z-10 text-2xl font-semibold text-default [text-shadow:0_2px_4px_#0000006e]"
    >
      D&D 2014
    </h2>

    <p class="relative z-10 text-default [text-shadow:0_2px_4px_#0000006e]">
      Предыдущая редакция Dungeon and Dragons
    </p>
  </NuxtLink>
</template>
