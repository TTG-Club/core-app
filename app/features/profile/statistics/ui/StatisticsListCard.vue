<script setup lang="ts">
  import type { UserStatistic } from '../model';

  import { ProfileCardUI } from '../model';
  import StatisticItem from './StatisticItem.vue';

  defineProps<{
    statistics: UserStatistic[];
  }>();

  defineEmits<{
    'update:visibility': [key: string, isPublic: boolean];
  }>();
</script>

<template>
  <UCard :ui="ProfileCardUI">
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <UIcon
            name="tabler:chart-bar"
            class="h-5 w-5 text-primary"
            aria-hidden="true"
          />

          <h3 class="font-semibold text-primary">Статистика активности</h3>
        </div>

        <UBadge
          color="neutral"
          variant="subtle"
        >
          <UIcon
            name="tabler:info-circle"
            aria-hidden="true"
          />
          Управляйте видимостью
        </UBadge>
      </div>
    </template>

    <div
      v-if="isDev"
      class="space-y-4"
      role="list"
      aria-label="Статистика пользователя"
    >
      <StatisticItem
        v-for="stat in statistics"
        :key="stat.key"
        :stat="stat"
        @update:visibility="
          (key, isPublic) => $emit('update:visibility', key, isPublic)
        "
      />
    </div>

    <div
      v-else
      class="space-y-4"
    >
      <UAlert
        icon="tabler:info-circle"
        color="neutral"
        variant="subtle"
        title="Статистика активности"
        description="Функция будет доступна в будущих обновлениях"
      />
    </div>
  </UCard>
</template>
