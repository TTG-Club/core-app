<script setup lang="ts">
  import type { RedeemResult } from '../model';

  import { useRedeem } from '../composables';
  import {
    normalizeCode,
    REWARD_PERK_LABELS,
    SUBSCRIPTION_TYPE_LABELS,
  } from '../model';

  const emit = defineEmits<{
    /** Код успешно погашен; передаём нормализованный код для разворота в списке. */
    redeemed: [code: string];
  }>();

  const { isRedeeming, redeem } = useRedeem();

  const code = ref('');
  const lastResult = ref<RedeemResult | null>(null);

  const grantedPerkLabels = computed(
    () =>
      lastResult.value?.grantedPerks.map((perk) => REWARD_PERK_LABELS[perk])
      ?? [],
  );

  // Достижения приходят кодами-строками — показываем код как есть.
  const grantedAchievementLabels = computed(
    () => lastResult.value?.grantedAchievements ?? [],
  );

  // Код принёс хоть что-то новое (часть наград могла уже быть у пользователя).
  const hasGranted = computed(
    () =>
      !!lastResult.value?.subscription
      || grantedPerkLabels.value.length > 0
      || grantedAchievementLabels.value.length > 0,
  );

  async function onSubmit(): Promise<void> {
    const entered = code.value;

    const result = await redeem(entered);

    if (!result) {
      return;
    }

    lastResult.value = result;
    code.value = '';
    emit('redeemed', normalizeCode(entered));
  }
</script>

<template>
  <div class="space-y-4">
    <form
      class="flex flex-col gap-3 sm:flex-row sm:items-start"
      @submit.prevent="onSubmit"
    >
      <UInput
        v-model="code"
        placeholder="Введите промокод"
        icon="tabler:ticket"
        size="lg"
        autocapitalize="characters"
        autocomplete="off"
        spellcheck="false"
        :disabled="isRedeeming"
        class="flex-1"
        :ui="{ base: 'uppercase' }"
      />

      <UButton
        type="submit"
        size="lg"
        color="primary"
        icon="tabler:gift"
        :loading="isRedeeming"
        :disabled="!code.trim()"
        class="shrink-0 justify-center"
      >
        Активировать
      </UButton>
    </form>

    <!-- Что получено по последнему коду -->
    <UAlert
      v-if="lastResult"
      :icon="hasGranted ? 'tabler:circle-check' : 'tabler:info-circle'"
      :color="hasGranted ? 'success' : 'neutral'"
      variant="subtle"
      :title="hasGranted ? 'Код активирован! Вы получили:' : 'Код активирован'"
    >
      <template #description>
        <div
          v-if="hasGranted"
          class="mt-1 space-y-1.5"
        >
          <p v-if="lastResult.subscription">
            Подписка ·
            {{ SUBSCRIPTION_TYPE_LABELS[lastResult.subscription.type] }} ·
            {{ lastResult.subscription.durationMonths }} мес.
            <span class="text-muted">(активируйте её ниже или на главной)</span>
          </p>

          <div
            v-if="grantedPerkLabels.length"
            class="flex flex-wrap gap-1.5"
          >
            <UBadge
              v-for="label in grantedPerkLabels"
              :key="label"
              color="success"
              variant="subtle"
              size="sm"
            >
              {{ label }}
            </UBadge>
          </div>

          <div
            v-if="grantedAchievementLabels.length"
            class="flex flex-wrap gap-1.5"
          >
            <UBadge
              v-for="label in grantedAchievementLabels"
              :key="label"
              color="info"
              variant="subtle"
              size="sm"
            >
              {{ label }}
            </UBadge>
          </div>

          <p class="text-xs text-muted">
            Ссылки на скачивание — в карточке кода ниже.
          </p>
        </div>

        <p v-else>
          Награды этого кода у вас уже были — все загрузки доступны в списке
          ниже.
        </p>
      </template>
    </UAlert>
  </div>
</template>
