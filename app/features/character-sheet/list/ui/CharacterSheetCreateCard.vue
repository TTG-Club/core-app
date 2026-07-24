<script setup lang="ts">
  const { disabled = false, loading = false } = defineProps<{
    /** Заблокировать создание (мутация списка в процессе). */
    disabled?: boolean;

    /** Показать индикатор загрузки во время создания. */
    loading?: boolean;
  }>();

  const emit = defineEmits<{
    create: [];
  }>();

  const iconName = computed(() =>
    loading ? 'tabler:loader-2' : 'tabler:user-plus',
  );
</script>

<template>
  <button
    type="button"
    class="group flex min-h-28 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-default bg-elevated/40 p-3 text-muted transition-all hover:border-primary hover:bg-primary/5 hover:text-primary disabled:pointer-events-none disabled:opacity-60"
    :disabled="disabled || loading"
    aria-label="Создать лист персонажа"
    @click.left.exact.prevent="emit('create')"
  >
    <UIcon
      :name="iconName"
      class="size-7 shrink-0 transition-transform group-hover:scale-110"
      :class="{ 'animate-spin': loading }"
    />

    <span class="text-sm font-medium"> Создать лист </span>
  </button>
</template>
