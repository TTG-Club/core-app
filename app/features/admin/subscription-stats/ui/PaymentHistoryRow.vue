<script setup lang="ts">
  import type { AdminPayment } from '../model';

  import { ADMIN_DASHBOARD_TOOLTIP_UI } from '~admin/dashboard/model';
  import { CODE_DETAIL_DATE_FORMAT } from '~admin/subscriptions/model';
  import { formatSubscriptionMonths } from '~vttg/model';

  import {
    PAYMENT_STATUS_COLORS,
    PAYMENT_STATUS_LABELS,
    SUBSCRIPTION_STATS_MONEY_FORMAT,
    SUBSCRIPTION_STATS_TEST_BADGE_HINT,
    SUBSCRIPTION_STATS_TEST_BADGE_LABEL,
  } from '../model';

  const props = defineProps<{
    payment: AdminPayment;
  }>();

  const emit = defineEmits<{
    /** Клик по строке: открыть профиль покупателя */
    select: [username: string];
  }>();

  const { format } = useDayjs();

  // Оплаченный показываем по моменту оплаты, остальные — по моменту создания.
  const paymentDateText = computed(() =>
    format(
      props.payment.paidAt ?? props.payment.createdAt,
      CODE_DETAIL_DATE_FORMAT,
    ),
  );

  const amountText = computed(() =>
    SUBSCRIPTION_STATS_MONEY_FORMAT.format(props.payment.amount),
  );

  const monthsText = computed(() =>
    formatSubscriptionMonths(props.payment.months),
  );

  const statusLabel = computed(
    () => PAYMENT_STATUS_LABELS[props.payment.status],
  );

  const statusColor = computed(
    () => PAYMENT_STATUS_COLORS[props.payment.status],
  );
</script>

<template>
  <li>
    <button
      type="button"
      class="flex min-h-13 w-full cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-left text-sm transition-colors hover:bg-elevated/60"
      @click.left.exact.prevent="emit('select', payment.username)"
    >
      <div class="flex min-w-0 flex-1 flex-col">
        <span class="truncate font-medium text-highlighted">
          {{ payment.username }}
        </span>

        <span
          v-if="payment.email"
          class="truncate text-xs text-muted"
        >
          {{ payment.email }}
        </span>
      </div>

      <span class="whitespace-nowrap text-muted">{{ monthsText }}</span>

      <span class="font-medium whitespace-nowrap text-highlighted tabular-nums">
        {{ amountText }}
      </span>

      <UTooltip
        v-if="payment.testMode"
        :text="SUBSCRIPTION_STATS_TEST_BADGE_HINT"
        :ui="ADMIN_DASHBOARD_TOOLTIP_UI"
      >
        <UBadge
          color="warning"
          variant="subtle"
          size="sm"
        >
          {{ SUBSCRIPTION_STATS_TEST_BADGE_LABEL }}
        </UBadge>
      </UTooltip>

      <UBadge
        :color="statusColor"
        variant="subtle"
        size="sm"
      >
        {{ statusLabel }}
      </UBadge>

      <span class="text-xs whitespace-nowrap text-muted tabular-nums">
        {{ paymentDateText }}
      </span>
    </button>
  </li>
</template>
