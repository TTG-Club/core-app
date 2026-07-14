<script setup lang="ts">
  const { value = undefined, size = 'sm' } = defineProps<{
    value?: number;
    /** Размер «самоцвета»: `xs` — подготовка, `sm` — бой, `lg` — герой лендинга. */
    size?: 'xs' | 'sm' | 'lg';
  }>();

  const display = computed(() =>
    typeof value === 'number' ? String(value) : '—',
  );

  const wrapperClass = computed(
    () => ({ xs: 'size-8', sm: 'size-11', lg: 'size-14' })[size],
  );

  const valueClass = computed(
    () => ({ xs: 'text-xs', sm: 'text-base', lg: 'text-2xl' })[size],
  );
</script>

<template>
  <div
    class="relative inline-grid shrink-0 place-items-center"
    :class="wrapperClass"
  >
    <div
      class="absolute inset-0 rounded-lg border border-primary bg-primary/10"
    />

    <span
      :key="display"
      class="initiative-die__value relative font-bold text-primary tabular-nums"
      :class="valueClass"
    >
      {{ display }}
    </span>
  </div>
</template>

<style scoped>
  @media (prefers-reduced-motion: no-preference) {
    .initiative-die__value {
      animation: initiative-die-pop 450ms ease-out;
    }
  }

  @keyframes initiative-die-pop {
    0% {
      transform: scale(0.3);
      opacity: 0;
    }

    60% {
      transform: scale(1.2);
      opacity: 1;
    }

    100% {
      transform: scale(1);
      opacity: 1;
    }
  }
</style>
