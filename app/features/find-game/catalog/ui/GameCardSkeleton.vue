<!-- Заглушка повторяет размеры карточки, чтобы сетка не дёргалась при загрузке. -->
<template>
  <div
    class="flex h-full flex-col overflow-hidden rounded-xl border border-default bg-elevated"
  >
    <USkeleton class="aspect-video w-full rounded-none" />

    <div class="flex flex-auto flex-col gap-3 p-4">
      <USkeleton class="h-6 w-3/4 rounded-md" />

      <div class="flex h-6 items-center gap-2">
        <USkeleton class="h-5 w-24 rounded-full" />

        <USkeleton class="h-4 w-20 rounded-md" />
      </div>

      <div class="mt-auto flex flex-col gap-1.5 border-t border-default pt-3">
        <USkeleton class="h-5 w-2/5 rounded-md" />

        <USkeleton class="h-5 w-1/3 rounded-md" />
      </div>
    </div>
  </div>
</template>
