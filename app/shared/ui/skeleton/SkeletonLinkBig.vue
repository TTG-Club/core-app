<template>
  <div class="overflow-hidden rounded-2xl border border-default bg-muted">
    <!-- Skeleton изображения -->
    <div class="relative h-[15.5rem]">
      <div class="pointer-events-none block w-full pb-[100%]" />

      <USkeleton class="absolute inset-0 h-full w-full rounded-none" />
    </div>

    <!-- Skeleton информации -->
    <div class="flex flex-col gap-0.5 px-4 py-3">
      <div class="mb-1 flex items-center gap-2">
        <USkeleton class="h-5 max-w-[12.5rem] flex-1" />

        <USkeleton class="h-[1.125rem] w-[3.75rem] rounded-full" />
      </div>

      <div>
        <USkeleton class="h-4 w-[8.75rem] max-w-full" />
      </div>
    </div>

    <!-- Skeleton для действий -->
    <div class="flex border-t border-default">
      <USkeleton class="h-11 flex-1 rounded-none border-r border-default" />

      <USkeleton class="h-11 flex-1 rounded-none" />
    </div>
  </div>
</template>
