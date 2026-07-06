<script setup lang="ts">
  import type { Subscription } from '../model';

  import {
    useMyCodes,
    useMySubscriptions,
    useSubscriptionActivation,
  } from '../composables';
  import {
    ProfileCardUI,
    REDEMPTION_DATE_FORMAT,
    SUBSCRIPTION_TYPE_LABELS,
  } from '../model';

  const { format } = useDayjs();

  // /my — авторитетный список подписок (показывает все, в т.ч. без кода-источника).
  const {
    subscriptions,
    isInitialLoading,
    refresh: refreshSubscriptions,
  } = useMySubscriptions();

  // /my-codes — только чтобы подписать «из какого кода» неактивированную подписку.
  const { codes, refresh: refreshCodes } = useMyCodes();
  const { activatingId, activate } = useSubscriptionActivation();

  const subs = computed<Subscription[]>(() => subscriptions.value ?? []);

  function byExpiresDesc(a: Subscription, b: Subscription): number {
    return (b.expiresAt ?? '').localeCompare(a.expiresAt ?? '');
  }

  // Активная — с самой поздней датой окончания.
  const active = computed<Subscription | null>(
    () =>
      [...subs.value]
        .filter((s) => s.status === 'ACTIVE')
        .sort(byExpiresDesc)[0] ?? null,
  );

  // Ожидающая активации (список с /my отсортирован по дате создания — берём первую).
  const registered = computed<Subscription | null>(
    () => subs.value.find((s) => s.status === 'REGISTERED') ?? null,
  );

  // Истёкшая — самая поздняя, показываем если нет активной/ожидающей.
  const expired = computed<Subscription | null>(
    () =>
      [...subs.value]
        .filter((s) => s.status === 'EXPIRED')
        .sort(byExpiresDesc)[0] ?? null,
  );

  // Код-источник ожидающей подписки (если привязка известна).
  const registeredCode = computed<string | null>(() => {
    const id = registered.value?.id;

    if (!id) {
      return null;
    }

    return (
      (codes.value ?? []).find((item) => item.subscription?.id === id)?.code
      ?? null
    );
  });

  const isActivating = computed(
    () => !!registered.value && activatingId.value === registered.value.id,
  );

  async function onActivate(): Promise<void> {
    if (!registered.value) {
      return;
    }

    const updated = await activate(registered.value.id);

    if (updated) {
      await Promise.all([refreshSubscriptions(), refreshCodes()]);
    }
  }
</script>

<template>
  <UCard :ui="ProfileCardUI">
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon
          name="tabler:crown"
          class="h-5 w-5 text-warning"
          aria-hidden="true"
        />

        <h3 class="font-semibold text-primary">Подписка</h3>
      </div>
    </template>

    <div
      v-if="isInitialLoading"
      class="flex items-center gap-2 text-sm text-muted"
    >
      <UIcon
        name="tabler:loader-2"
        class="h-5 w-5 animate-spin"
      />
      Загрузка…
    </div>

    <div
      v-else
      class="space-y-4"
    >
      <!-- Текущий статус -->
      <div
        v-if="active"
        class="flex items-start gap-3"
      >
        <UIcon
          name="tabler:circle-check"
          class="mt-0.5 h-5 w-5 shrink-0 text-success"
          aria-hidden="true"
        />

        <div class="text-sm">
          <p class="font-medium text-highlighted">
            Подписка активна
            <span class="text-muted">
              · {{ SUBSCRIPTION_TYPE_LABELS[active.type] }}
            </span>
          </p>

          <p
            v-if="active.expiresAt"
            class="text-muted"
          >
            Действует до {{ format(active.expiresAt, REDEMPTION_DATE_FORMAT) }}
          </p>
        </div>
      </div>

      <div
        v-else-if="expired"
        class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="flex items-start gap-3">
          <UIcon
            name="tabler:circle-x"
            class="mt-0.5 h-5 w-5 shrink-0 text-error"
            aria-hidden="true"
          />

          <div class="text-sm">
            <p class="font-medium text-highlighted">Подписка истекла</p>

            <p
              v-if="expired.expiresAt"
              class="text-muted"
            >
              Закончилась
              {{ format(expired.expiresAt, REDEMPTION_DATE_FORMAT) }}
            </p>
          </div>
        </div>

        <UButton
          v-if="!registered"
          to="/user/profile/activation"
          icon="tabler:ticket"
          color="neutral"
          variant="soft"
          size="sm"
          class="shrink-0 self-start sm:self-auto"
        >
          Активировать код
        </UButton>
      </div>

      <div
        v-else-if="!registered"
        class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="flex items-start gap-3">
          <UIcon
            name="tabler:gift-off"
            class="mt-0.5 h-5 w-5 shrink-0 text-muted"
            aria-hidden="true"
          />

          <p class="text-sm text-muted">
            Активной подписки нет. Активируйте промокод, чтобы получить подписку
            и награды.
          </p>
        </div>

        <UButton
          to="/user/profile/activation"
          icon="tabler:ticket"
          color="primary"
          variant="soft"
          size="sm"
          class="shrink-0 self-start sm:self-auto"
        >
          Активировать код
        </UButton>
      </div>

      <!-- Ожидающая активации подписка — независимо от наличия активной -->
      <div
        v-if="registered"
        class="flex flex-col gap-3 rounded-lg border border-warning/40 bg-warning/5 p-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="flex items-start gap-3">
          <UIcon
            name="tabler:clock-pause"
            class="mt-0.5 h-5 w-5 shrink-0 text-warning"
            aria-hidden="true"
          />

          <div class="text-sm">
            <p class="font-medium text-highlighted">
              Есть неактивированная подписка
            </p>

            <p class="text-muted">
              {{ SUBSCRIPTION_TYPE_LABELS[registered.type] }} ·
              {{ registered.durationMonths }} мес.
              <template v-if="registeredCode">
                · из кода <span class="font-mono">{{ registeredCode }}</span>
              </template>
            </p>
          </div>
        </div>

        <UButton
          icon="tabler:player-play"
          color="primary"
          size="sm"
          :loading="isActivating"
          class="shrink-0 self-start sm:self-auto"
          @click.left.exact.prevent="onActivate"
        >
          Активировать
        </UButton>
      </div>
    </div>
  </UCard>
</template>
