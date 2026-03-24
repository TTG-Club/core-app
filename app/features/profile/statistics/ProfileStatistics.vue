<script setup lang="ts">
  import type { UserStatistic } from './model';

  import { useStatistics } from './composables';
  import { StatisticTypes } from './model';
  import { StatisticsListCard, VisibilityInfoCard } from './ui';

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

  const { updateStatisticVisibility } = useStatistics();

  /**
   * Обработчик изменения видимости статистики
   */
  async function handleVisibilityChange(key: string, isPublic: boolean) {
    const success = await updateStatisticVisibility(key, isPublic);

    if (!success) {
      const statisticItem = statistics.value.find((item) => item.key === key);

      if (statisticItem) {
        statisticItem.isPublic = !isPublic;
      }
    }
  }
</script>

<template>
  <div class="space-y-6">
    <StatisticsListCard
      :statistics="statistics"
      @update:visibility="handleVisibilityChange"
    />

    <VisibilityInfoCard />
  </div>
</template>
