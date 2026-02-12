<template>
  <NuxtLink
    :class="[
      'relative flex flex-col gap-3 bg-muted p-6',
      'rounded-lg border border-default shadow-lg',
      'overflow-hidden no-underline',
      'before:absolute before:inset-0',
      'before:block before:size-full',
      'before:bg-[url(/s3/home/calculator-abilities-banner.webp)]',
      'before:bg-cover before:bg-center before:bg-no-repeat before:opacity-40',
      'before:transition-transform before:duration-200',
      'hover:before:scale-115',
    ]"
    to="/tokenator"
  >
    <span class="relative z-10 text-2xl">Калькулятор характеристик</span>

    <p class="relative z-10">Идеальный баланс твоего персонажа</p>
  </NuxtLink>
</template>
