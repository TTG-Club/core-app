<script setup lang="ts">
  const { label, accent = false } = defineProps<{
    /** Микро-подпись над значением («КД», «Бонус», «Иниц.»). */
    label: string;
    /** Акцентная (primary) плитка — для итога инициативы. */
    accent?: boolean;
  }>();

  const tileClass = computed(() =>
    accent ? 'border-primary bg-primary/10' : 'border-default bg-elevated',
  );

  const labelClass = computed(() =>
    accent ? 'text-primary/70' : 'text-muted',
  );

  const valueClass = computed(() =>
    accent ? 'text-primary' : 'text-highlighted',
  );
</script>

<!-- Плитка стата участника: все значения в строке (КД, бонус, итог
     инициативы) рендерятся в одинаковых «жетонах» одной высоты, чтобы ряд
     не распадался на разномастные контролы. -->
<template>
  <div
    class="flex h-11 flex-col items-center justify-center gap-1 rounded-lg border px-1"
    :class="tileClass"
  >
    <span
      class="flex items-center gap-0.5 text-[10px] leading-none font-medium tracking-wider uppercase"
      :class="labelClass"
    >
      {{ label }}

      <slot name="label-icon" />
    </span>

    <div
      class="flex items-center justify-center text-sm leading-none font-bold tabular-nums"
      :class="valueClass"
    >
      <slot />
    </div>
  </div>
</template>
