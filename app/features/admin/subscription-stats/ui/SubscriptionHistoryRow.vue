<script setup lang="ts">
  import type { AdminSubscription } from '../model';

  import {
    ADMIN_SUBSCRIPTION_DATE_FORMAT,
    ADMIN_SUBSCRIPTION_STATUS_COLORS,
    ADMIN_SUBSCRIPTION_STATUS_LABELS,
    ADMIN_SUBSCRIPTION_TYPE_LABELS,
  } from '~admin/users/model';
  import { formatSubscriptionMonths } from '~vttg/model';

  import {
    joinSubscriptionPeriod,
    SUBSCRIPTION_STATS_UNASSIGNED_OWNER_LABEL,
    SUBSCRIPTION_TYPE_COLORS,
  } from '../model';

  const props = defineProps<{
    subscription: AdminSubscription;
  }>();

  const { format } = useDayjs();

  const ownerText = computed(
    () =>
      props.subscription.ownerUsername
      ?? SUBSCRIPTION_STATS_UNASSIGNED_OWNER_LABEL,
  );

  const ownerClass = computed(() =>
    props.subscription.ownerUsername ? 'text-highlighted' : 'text-muted',
  );

  const typeLabel = computed(
    () => ADMIN_SUBSCRIPTION_TYPE_LABELS[props.subscription.type],
  );

  const typeColor = computed(
    () => SUBSCRIPTION_TYPE_COLORS[props.subscription.type],
  );

  const statusLabel = computed(
    () => ADMIN_SUBSCRIPTION_STATUS_LABELS[props.subscription.status],
  );

  const statusColor = computed(
    () => ADMIN_SUBSCRIPTION_STATUS_COLORS[props.subscription.status],
  );

  const monthsText = computed(() =>
    formatSubscriptionMonths(props.subscription.durationMonths),
  );

  // Срок действия есть только у активированной подписки; иначе — дата выдачи.
  const periodText = computed(() => {
    const { startsAt, expiresAt, createdAt } = props.subscription;

    if (startsAt && expiresAt) {
      return joinSubscriptionPeriod(
        format(startsAt, ADMIN_SUBSCRIPTION_DATE_FORMAT),
        format(expiresAt, ADMIN_SUBSCRIPTION_DATE_FORMAT),
      );
    }

    return format(createdAt, ADMIN_SUBSCRIPTION_DATE_FORMAT);
  });
</script>

<template>
  <li class="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-sm">
    <span
      class="min-w-0 flex-1 truncate font-medium"
      :class="ownerClass"
    >
      {{ ownerText }}
    </span>

    <span class="whitespace-nowrap text-muted">{{ monthsText }}</span>

    <UBadge
      :color="typeColor"
      variant="subtle"
      size="sm"
    >
      {{ typeLabel }}
    </UBadge>

    <UBadge
      :color="statusColor"
      variant="subtle"
      size="sm"
    >
      {{ statusLabel }}
    </UBadge>

    <span class="text-xs whitespace-nowrap text-muted tabular-nums">
      {{ periodText }}
    </span>
  </li>
</template>
