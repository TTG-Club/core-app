<script setup lang="ts">
  import type {
    AdminSubscriptionResponse,
    AdminSubscriptionStatus,
  } from '../model';

  import { useUserSubscription } from '../composables';
  import {
    ADMIN_SUBSCRIPTION_DATE_FORMAT,
    ADMIN_SUBSCRIPTION_GRANT_MONTHS_DEFAULT,
    ADMIN_SUBSCRIPTION_GRANT_MONTHS_MAX,
    ADMIN_SUBSCRIPTION_GRANT_MONTHS_MIN,
    ADMIN_SUBSCRIPTION_SECTION_TITLE,
    ADMIN_SUBSCRIPTION_STATUS_COLORS,
    ADMIN_SUBSCRIPTION_STATUS_LABELS,
    ADMIN_SUBSCRIPTION_TYPE_LABELS,
  } from '../model';

  const props = defineProps<{
    username: string;
  }>();

  const { format } = useDayjs();

  const {
    subscription,
    isLoading,
    isGranting,
    isRevoking,
    load,
    grant,
    revoke,
  } = useUserSubscription(() => props.username);

  const months = ref(ADMIN_SUBSCRIPTION_GRANT_MONTHS_DEFAULT);

  // В детальной панели подписка — постоянная секция: грузим статус при монтировании.
  // Пользователь пересобирается по :key="user.id", поэтому onMounted срабатывает
  // заново на каждого выбранного пользователя.
  onMounted(load);

  const status = computed<AdminSubscriptionStatus | null>(
    () => subscription.value?.status ?? null,
  );

  const statusLabel = computed(() =>
    status.value ? ADMIN_SUBSCRIPTION_STATUS_LABELS[status.value] : null,
  );

  const statusColor = computed(() =>
    status.value ? ADMIN_SUBSCRIPTION_STATUS_COLORS[status.value] : 'neutral',
  );

  const typeLabel = computed(() =>
    subscription.value?.type
      ? ADMIN_SUBSCRIPTION_TYPE_LABELS[subscription.value.type]
      : null,
  );

  const periodLabel = computed(() => {
    const data: AdminSubscriptionResponse | null = subscription.value;

    if (!data?.startsAt && !data?.expiresAt) {
      return null;
    }

    const from = data.startsAt
      ? format(data.startsAt, ADMIN_SUBSCRIPTION_DATE_FORMAT)
      : '—';

    const to = data.expiresAt
      ? format(data.expiresAt, ADMIN_SUBSCRIPTION_DATE_FORMAT)
      : '—';

    return `${from} — ${to}`;
  });

  // Отключать можно только реально действующую/ожидающую подписку.
  const canRevoke = computed(
    () =>
      !!subscription.value?.active
      || status.value === 'ACTIVE'
      || status.value === 'REGISTERED',
  );

  const isBusy = computed(() => isGranting.value || isRevoking.value);

  async function onGrant(): Promise<void> {
    await grant(months.value);
  }

  async function onRevoke(): Promise<void> {
    await revoke();
  }
</script>

<template>
  <div class="space-y-4">
    <!-- Заголовок секции -->
    <div class="flex items-center gap-2">
      <UIcon
        name="tabler:crown"
        class="h-5 w-5 text-warning"
        aria-hidden="true"
      />

      <span class="text-sm font-medium text-highlighted">
        {{ ADMIN_SUBSCRIPTION_SECTION_TITLE }}
      </span>
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
      Загрузка…
    </div>

    <div
      v-else
      class="space-y-4"
    >
      <!-- Текущий статус -->
      <div class="flex flex-wrap items-center gap-2">
        <UBadge
          v-if="statusLabel"
          :color="statusColor"
          variant="subtle"
          size="sm"
        >
          {{ statusLabel }}
        </UBadge>

        <UBadge
          v-else
          color="neutral"
          variant="subtle"
          size="sm"
        >
          Подписки нет
        </UBadge>

        <UBadge
          v-if="typeLabel"
          color="neutral"
          variant="subtle"
          size="sm"
        >
          {{ typeLabel }}
        </UBadge>

        <span
          v-if="periodLabel"
          class="text-xs text-muted"
        >
          {{ periodLabel }}
        </span>
      </div>

      <!-- Действия -->
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
        <UFormField
          label="Выдать, месяцев"
          class="sm:w-40"
        >
          <UInputNumber
            v-model="months"
            :min="ADMIN_SUBSCRIPTION_GRANT_MONTHS_MIN"
            :max="ADMIN_SUBSCRIPTION_GRANT_MONTHS_MAX"
            :disabled="isBusy"
            class="w-full"
          />
        </UFormField>

        <div class="flex flex-wrap gap-2">
          <UButton
            icon="tabler:gift"
            color="primary"
            :loading="isGranting"
            :disabled="isRevoking"
            @click.left.exact.prevent="onGrant"
          >
            Выдать
          </UButton>

          <UButton
            icon="tabler:player-stop"
            color="error"
            variant="soft"
            :loading="isRevoking"
            :disabled="isGranting || !canRevoke"
            @click.left.exact.prevent="onRevoke"
          >
            Отключить
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
