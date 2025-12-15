<script setup lang="ts">
  import { AnimatedNumber } from '~ui/animated-number';

  const { isAdmin } = useUserRoles();

  const {
    data: counter,
    refresh,
    status: counterStatus,
  } = await useAsyncData('material-counter', () =>
    $fetch<number>('/api/v2/statistics/count-all'),
  );

  const { execute: reset, status: resetStatus } = await useAsyncData(
    'material-counter-reset-cache',
    () =>
      $fetch('/api/v2/cache/evict-all', {
        onResponse: ({ response }) => {
          if (!response.ok) {
            return;
          }

          refresh();
        },
      }),
    {
      immediate: false,
      server: false,
    },
  );

  const isLoading = computed(
    () => counterStatus.value === 'pending' && resetStatus.value === 'pending',
  );
</script>

<template>
  <div
    :class="[
      'relative flex flex-col gap-3 self-start overflow-hidden',
      'rounded-[10px] border border-default p-3 shadow-lg',
      'bg-muted text-default no-underline',
    ]"
  >
    <div class="flex h-4 items-center justify-between gap-2">
      <h3 class="text-base leading-none font-medium">Статистика</h3>

      <UButton
        v-if="isAdmin"
        :loading="isLoading"
        icon="i-fluent-arrow-sync-16-regular"
        variant="ghost"
        size="sm"
        @click.left.exact.prevent="reset()"
      />
    </div>

    <p>
      В настоящее время на сайте представлено следующее количество материалов:
    </p>

    <AnimatedNumber
      class="text-[32px] leading-[32px] font-semibold text-(--color-primary)"
      :value="counter"
    />
  </div>
</template>
