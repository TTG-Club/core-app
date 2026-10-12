<script setup lang="ts">
  import { useUserSubscriptionHistory } from '../composables';
  import {
    ADMIN_SUBSCRIPTION_DATE_FORMAT,
    ADMIN_SUBSCRIPTION_EVENT_COLORS,
    ADMIN_SUBSCRIPTION_EVENT_ICONS,
    ADMIN_SUBSCRIPTION_EVENT_LABELS,
    ADMIN_SUBSCRIPTION_HISTORY_ICON,
    ADMIN_SUBSCRIPTION_HISTORY_TEXT,
    ADMIN_SUBSCRIPTION_HISTORY_TITLE,
    ADMIN_USERS_DATE_FORMAT,
  } from '../model';

  const props = defineProps<{
    username: string;
  }>();

  const { format } = useDayjs();

  const { events, isLoading } = useUserSubscriptionHistory(
    () => props.username,
  );

  /** Дата окончания подписки или «нет», если подписки не было. */
  function formatExpiry(value: string | null | undefined): string {
    return value
      ? format(value, ADMIN_SUBSCRIPTION_DATE_FORMAT)
      : ADMIN_SUBSCRIPTION_HISTORY_TEXT.noSubscription;
  }

  /** События в виде строк списка: подпись, детали и изменение окончания. */
  const rows = computed(() =>
    events.value.map((event) => {
      const details: Array<string> = [];

      if (event.months) {
        details.push(
          `+${event.months} ${ADMIN_SUBSCRIPTION_HISTORY_TEXT.monthsSuffix}`,
        );
      }

      if (event.amount !== null && event.amount !== undefined) {
        details.push(
          `${event.amount} ${ADMIN_SUBSCRIPTION_HISTORY_TEXT.currency}`,
        );
      }

      if (event.code) {
        details.push(
          `${ADMIN_SUBSCRIPTION_HISTORY_TEXT.codePrefix} ${event.code}`,
        );
      }

      if (event.actorUsername) {
        details.push(
          `${ADMIN_SUBSCRIPTION_HISTORY_TEXT.actorPrefix} ${event.actorUsername}`,
        );
      }

      return {
        id: event.id,
        label: ADMIN_SUBSCRIPTION_EVENT_LABELS[event.type],
        icon: ADMIN_SUBSCRIPTION_EVENT_ICONS[event.type],
        iconClass: ADMIN_SUBSCRIPTION_EVENT_COLORS[event.type],
        date: event.createdAt
          ? format(event.createdAt, ADMIN_USERS_DATE_FORMAT)
          : '',
        details: details.join(' · '),
        expiry: `${ADMIN_SUBSCRIPTION_HISTORY_TEXT.expiresLabel} ${formatExpiry(event.expiresBefore)} → ${formatExpiry(event.expiresAfter)}`,
      };
    }),
  );
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center gap-2">
      <UIcon
        :name="ADMIN_SUBSCRIPTION_HISTORY_ICON"
        class="h-5 w-5 text-primary"
        aria-hidden="true"
      />

      <span class="text-sm font-medium text-highlighted">
        {{ ADMIN_SUBSCRIPTION_HISTORY_TITLE }}
      </span>

      <UBadge
        v-if="!isLoading && rows.length"
        color="neutral"
        variant="subtle"
        size="sm"
      >
        {{ rows.length }}
      </UBadge>
    </div>

    <div
      v-if="isLoading"
      class="flex items-center gap-2 text-sm text-muted"
    >
      <UIcon
        name="tabler:loader-2"
        class="h-5 w-5 animate-spin"
        aria-hidden="true"
      />
      {{ ADMIN_SUBSCRIPTION_HISTORY_TEXT.loading }}
    </div>

    <p
      v-else-if="!rows.length"
      class="text-sm text-muted"
    >
      {{ ADMIN_SUBSCRIPTION_HISTORY_TEXT.empty }}
    </p>

    <ol
      v-else
      class="flex flex-col gap-2"
    >
      <li
        v-for="row in rows"
        :key="row.id"
        class="flex gap-3 rounded-lg border border-default bg-elevated/40 px-3 py-2"
      >
        <UIcon
          :name="row.icon"
          :class="row.iconClass"
          class="mt-0.5 h-5 w-5 shrink-0"
          aria-hidden="true"
        />

        <div class="flex min-w-0 flex-1 flex-col gap-0.5">
          <div class="flex items-center justify-between gap-3">
            <span class="text-sm font-medium text-highlighted">
              {{ row.label }}
            </span>

            <span class="shrink-0 text-xs whitespace-nowrap text-muted">
              {{ row.date }}
            </span>
          </div>

          <span
            v-if="row.details"
            class="text-xs text-toned"
          >
            {{ row.details }}
          </span>

          <span class="text-xs text-muted">
            {{ row.expiry }}
          </span>
        </div>
      </li>
    </ol>
  </div>
</template>
