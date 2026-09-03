<!-- Заглушка повторяет размеры карточки, чтобы сетка не дёргалась при загрузке. -->
<template>
  <UCard :ui="{ body: 'flex h-full flex-col gap-3 p-4' }">
    <USkeleton class="aspect-video w-full rounded-md" />

    <USkeleton class="h-12 w-3/4 rounded-md" />

    <div class="flex h-12 flex-wrap items-start gap-1.5 overflow-hidden">
      <USkeleton class="h-5 w-24 rounded-full" />

      <USkeleton class="h-5 w-20 rounded-full" />

      <USkeleton class="h-5 w-24 rounded-full" />
    </div>

    <div class="mt-auto flex flex-col gap-1">
      <USkeleton class="h-5 w-2/5 rounded-md" />

      <USkeleton class="h-5 w-1/3 rounded-md" />
    </div>
  </UCard>
</template>
