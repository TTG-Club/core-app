<script setup lang="ts">
  import type { RedemptionCodeResponse } from '../model';

  import { useSubscriptionCodes } from '../composables';
  import {
    CODE_LIST_DATE_FORMAT,
    CODE_STATUS_COLORS,
    CODE_STATUS_LABELS,
    getCodeStatus,
    REWARD_TIER_LABELS,
    SUBSCRIPTION_TYPE_LABELS,
  } from '../model';

  const { code, isOpened } = defineProps<{
    code: RedemptionCodeResponse;
    isOpened?: boolean;
  }>();

  const emit = defineEmits<{
    select: [id: string];
    updated: [code: RedemptionCodeResponse];
  }>();

  const { format } = useDayjs();
  const { updatingId, setCodeDisabled } = useSubscriptionCodes();

  const status = computed(() => getCodeStatus(code));

  const extrasCount = computed(
    () => code.perks.length + code.achievements.length,
  );

  async function onToggleActive(active: boolean): Promise<void> {
    const updated = await setCodeDisabled(code.id, !active);

    if (updated) {
      emit('updated', updated);
    }
  }
</script>

<template>
  <div
    class="flex cursor-pointer flex-row flex-wrap items-center justify-between gap-x-6 gap-y-2 rounded-xl border px-4 py-3 transition select-none"
    :class="[
      isOpened
        ? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary/50'
        : 'border-default bg-elevated hover:border-accented hover:bg-accented',
      { 'opacity-60': status === 'disabled' },
    ]"
    @click.left.exact.prevent="emit('select', code.id)"
  >
    <!-- Слева: статус + код -->
    <div class="flex min-w-0 items-center gap-3">
      <div class="flex w-28 shrink-0">
        <UBadge
          :color="CODE_STATUS_COLORS[status]"
          variant="subtle"
          size="sm"
        >
          {{ CODE_STATUS_LABELS[status] }}
        </UBadge>
      </div>

      <code class="truncate font-mono text-sm text-highlighted">
        {{ code.code }}
      </code>
    </div>

    <!-- Справа: краткое содержимое + дата + тумблер -->
    <div class="flex items-center gap-2 text-xs text-secondary">
      <UBadge
        v-if="code.subscriptionType && code.subscriptionMonths"
        color="primary"
        variant="subtle"
        size="sm"
      >
        {{ SUBSCRIPTION_TYPE_LABELS[code.subscriptionType] }} ·
        {{ code.subscriptionMonths }} мес.
      </UBadge>

      <UBadge
        v-if="extrasCount"
        color="neutral"
        variant="subtle"
        size="sm"
      >
        +{{ extrasCount }}
      </UBadge>

      <UBadge
        v-if="code.rewardTier"
        color="warning"
        variant="subtle"
        size="sm"
      >
        {{ REWARD_TIER_LABELS[code.rewardTier] }}
      </UBadge>

      <span class="hidden whitespace-nowrap sm:inline">
        {{ format(code.createdAt, CODE_LIST_DATE_FORMAT) }}
      </span>

      <!-- Тумблер деактивации (без подписи); не открывает деталь -->
      <span
        v-if="!code.redeemedBy"
        class="ml-1 flex shrink-0"
        @click.stop
      >
        <USwitch
          :model-value="!code.disabled"
          :disabled="updatingId === code.id"
          size="sm"
          @update:model-value="onToggleActive"
        />
      </span>
    </div>
  </div>
</template>
