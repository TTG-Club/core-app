<script setup lang="ts">
  import type { VttgSubscriptionLimit } from '../model';

  import { VTTG_SUBSCRIPTION_LIMIT_LABELS } from '../model';

  const { limit } = defineProps<{
    limit: VttgSubscriptionLimit;
  }>();

  const baseValue = computed(
    () => limit.base ?? VTTG_SUBSCRIPTION_LIMIT_LABELS.unavailable,
  );
</script>

<template>
  <div class="flex w-full flex-col gap-2">
    <span class="text-sm font-medium text-toned">
      {{ limit.label }}
    </span>

    <!-- Каждое число подписано: слева без подписки, справа с ней. -->
    <dl class="grid grid-cols-2 overflow-hidden rounded-lg ring ring-default">
      <div class="flex flex-col gap-0.5 bg-elevated px-4 py-3">
        <dt class="text-xs text-muted">
          {{ VTTG_SUBSCRIPTION_LIMIT_LABELS.base }}
        </dt>

        <dd class="text-2xl font-semibold text-toned">
          {{ baseValue }}
        </dd>
      </div>

      <div class="flex flex-col gap-0.5 bg-primary/10 px-4 py-3">
        <dt class="text-xs text-primary">
          {{ VTTG_SUBSCRIPTION_LIMIT_LABELS.subscriber }}
        </dt>

        <dd class="text-2xl font-bold text-primary">
          {{ limit.subscriber }}
        </dd>
      </div>
    </dl>
  </div>
</template>
