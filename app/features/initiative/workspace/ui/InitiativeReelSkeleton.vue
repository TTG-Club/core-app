<script setup lang="ts">
  /** Заглушка ленты до старта боя: круги-плейсхолдеры с крупным «текущим». */
  const SLOTS = [
    { key: 'l2', ring: 'size-12', opacity: 'opacity-25' },
    { key: 'l1', ring: 'size-14', opacity: 'opacity-50' },
    { key: 'c', ring: 'size-20', opacity: 'opacity-100', current: true },
    { key: 'r1', ring: 'size-14', opacity: 'opacity-50' },
    { key: 'r2', ring: 'size-12', opacity: 'opacity-25' },
  ];
</script>

<template>
  <div class="flex flex-col gap-3">
    <div
      class="relative flex h-44 items-center justify-center gap-4 overflow-hidden"
      aria-hidden="true"
    >
      <div
        v-for="slot in SLOTS"
        :key="slot.key"
        class="flex flex-col items-center gap-2"
        :class="slot.opacity"
      >
        <div
          class="rounded-full"
          :class="[
            slot.ring,
            slot.current
              ? 'border-2 border-dashed border-primary/40 bg-primary/5'
              : 'border border-dashed border-default bg-elevated',
          ]"
        />

        <USkeleton class="h-2.5 w-12 rounded" />
      </div>
    </div>

    <!-- Подпись повторяет структуру подписи живой ленты (text-xs + text-lg),
         чтобы блок был пиксель-в-пиксель той же высоты в подготовке и бою. -->
    <div class="flex flex-col items-center gap-0.5">
      <span class="text-xs tracking-widest text-muted uppercase">
        Бой ещё не начался
      </span>

      <span class="text-lg font-semibold text-highlighted">
        Соберите отряд
      </span>
    </div>
  </div>
</template>
