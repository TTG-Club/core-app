<script setup lang="ts">
  import { useUserProfile } from '../composables/useUserProfile';
  import { ProfileCardUI, StatisticTypes } from '../model';

  import StatisticCard from './StatisticCard.vue';

  import type { UserStatistic } from '../model';

  /**
   * Статистика пользователя (временные данные)
   */
  const statistics = ref<UserStatistic[]>(
    StatisticTypes.map((stat) => ({
      key: stat.key,
      label: stat.label,
      icon: stat.icon,
      value: Math.floor(Math.random() * 100),
      isPublic: false,
    })),
  );

  const { updateStatisticVisibility } = useUserProfile();

  /**
   * Обработчик изменения видимости статистики
   */
  async function handleVisibilityChange(key: string, isPublic: boolean) {
    const success = await updateStatisticVisibility(key, isPublic);

    if (!success) {
      // Откатываем изменение при ошибке
      const stat = statistics.value.find((s) => s.key === key);

      if (stat) {
        stat.isPublic = !isPublic;
      }
    }
  }
</script>

<template>
  <div class="space-y-6">
    <!-- Статистика -->
    <UCard :ui="ProfileCardUI">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon
              name="i-fluent-data-bar-vertical-24-regular"
              class="h-5 w-5 text-primary-500"
              aria-hidden="true"
            />

            <h3 class="font-semibold text-primary">Статистика активности</h3>
          </div>

          <UBadge
            color="neutral"
            variant="subtle"
          >
            <UIcon
              name="i-fluent-info-24-regular"
              aria-hidden="true"
            />
            Управляйте видимостью
          </UBadge>
        </div>
      </template>

      <div
        class="space-y-4"
        role="list"
        aria-label="Статистика пользователя"
      >
        <StatisticCard
          v-for="stat in statistics"
          :key="stat.key"
          :stat="stat"
          @update:visibility="handleVisibilityChange"
        />
      </div>
    </UCard>

    <!-- Информация -->
    <UCard :ui="{ body: 'p-6' }">
      <UAlert
        icon="i-fluent-eye-24-regular"
        color="neutral"
        variant="subtle"
        title="О видимости статистики"
        description="Публичная статистика будет видна другим пользователям в вашем профиле. Приватная статистика доступна только вам."
      />
    </UCard>
  </div>
</template>
