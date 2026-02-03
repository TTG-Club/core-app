<template>
  <NuxtLink
    :class="[
      'relative flex flex-col gap-3 bg-muted p-6',
      'rounded-lg border border-default shadow-lg',
      'overflow-hidden no-underline',
      'before:absolute before:inset-0',
      'before:block before:size-full',
      'before:bg-[url(/s3/home/TokenatorBanner.webp)] before:opacity-40',
      'before:bg-cover before:bg-center before:bg-no-repeat',
      'before:transition-transform before:duration-200',
      'hover:before:scale-115',
    ]"
    to="/tokenator"
  >
    <span class="relative z-10 text-2xl">Токенатор</span>

    <p class="relative z-10">Создай уникальный токен персонажа!</p>
  </NuxtLink>
</template>
