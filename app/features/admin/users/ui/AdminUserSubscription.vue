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

  // Статус грузим лениво — только при первом раскрытии блока.
  const isLoaded = ref(false);

  async function onOpenChange(open: boolean): Promise<void> {
    if (open && !isLoaded.value) {
      isLoaded.value = true;
      await load();
    }
  }

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
  <UCollapsible
    :ui="{ content: 'pt-4' }"
    @update:open="onOpenChange"
  >
    <template #default="{ open }">
      <div
        class="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-default bg-elevated/40 px-3 py-2.5 transition-colors hover:bg-hover"
      >
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

        <UIcon
          name="tabler:chevron-down"
          class="h-5 w-5 shrink-0 text-muted transition-transform duration-150"
          :class="open ? '-rotate-180' : ''"
          aria-hidden="true"
        />
      </div>
    </template>

    <template #content>
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
    </template>
  </UCollapsible>
</template>
