<script setup lang="ts">
  import { useMyCodes, useMyRewards, useMySubscriptions } from './composables';
  import { ProfileCardUI } from './model';
  import {
    RedeemCodeForm,
    RedeemedCodeItem,
    SubscriptionStatusCard,
  } from './ui';

  const { codes, isLoading, refresh: refreshCodes } = useMyCodes();
  const { refresh: refreshSubscriptions } = useMySubscriptions();
  const { refresh: refreshRewards } = useMyRewards();

  // Код, который нужно показать развёрнутым (только что погашенный).
  const expandedCode = ref<string | null>(null);

  // Обновляем коды, подписки и перки — карточка статуса и бейдж/значок/цвет ника
  // в сайдбаре зависят от этих источников (данные шарятся по ключу useAsyncData).
  async function refreshAll(): Promise<void> {
    await Promise.all([
      refreshCodes(),
      refreshSubscriptions(),
      refreshRewards(),
    ]);
  }

  async function onRedeemed(code: string): Promise<void> {
    expandedCode.value = code;
    await refreshAll();
  }
</script>

<template>
  <div class="space-y-6">
    <!-- Текущая подписка -->
    <SubscriptionStatusCard />

    <!-- Активация промокода -->
    <UCard :ui="ProfileCardUI">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="tabler:ticket"
            class="h-5 w-5 text-primary"
            aria-hidden="true"
          />

          <h3 class="font-semibold text-primary">Активация промокода</h3>
        </div>
      </template>

      <RedeemCodeForm @redeemed="onRedeemed" />
    </UCard>

    <!-- Активированные коды -->
    <UCard :ui="ProfileCardUI">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="tabler:list-check"
            class="h-5 w-5 text-primary"
            aria-hidden="true"
          />

          <h3 class="font-semibold text-primary">Активированные коды</h3>
        </div>
      </template>

      <div
        v-if="isLoading"
        class="space-y-2"
      >
        <USkeleton
          v-for="index in 3"
          :key="index"
          class="h-16 w-full rounded-xl"
        />
      </div>

      <div
        v-else-if="codes?.length"
        class="flex flex-col gap-3"
      >
        <RedeemedCodeItem
          v-for="redemption in codes"
          :key="redemption.id"
          :redemption="redemption"
          :default-open="redemption.code === expandedCode"
          @activated="refreshAll"
        />
      </div>

      <div
        v-else
        class="flex min-h-[140px] items-center justify-center rounded-xl border border-dashed border-default bg-elevated p-8"
      >
        <UEmpty
          icon="tabler:ticket-off"
          title="Пока нет активированных кодов"
          description="Введите промокод выше, чтобы получить награды и подписку"
        />
      </div>
    </UCard>
  </div>
</template>
