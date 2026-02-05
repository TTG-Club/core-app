<script setup lang="ts">
  import { StatisticTypes } from '../model';

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

  /**
   * Обработчик изменения видимости статистики
   */
  function handleVisibilityChange(_key: string, _isPublic: boolean) {
    // TODO: Реализовать сохранение настроек через API
  }
</script>

<template>
  <div class="space-y-6">
    <!-- Статистика -->
    <UCard :ui="{ header: 'px-6 py-4', body: 'p-6' }">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon
              name="i-fluent-data-bar-vertical-24-regular"
              class="h-5 w-5 text-primary-500"
            />

            <h3 class="font-semibold text-white">Статистика активности</h3>
          </div>

          <UBadge
            color="neutral"
            variant="subtle"
          >
            <UIcon name="i-fluent-info-24-regular" />
            Управляйте видимостью
          </UBadge>
        </div>
      </template>

      <div class="space-y-4">
        <div
          v-for="stat in statistics"
          :key="stat.key"
          class="flex items-center justify-between gap-4 rounded-lg border border-gray-800 bg-gray-900/40 p-4 transition-colors hover:border-gray-700"
        >
          <!-- Иконка и информация -->
          <div class="flex flex-1 items-center gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-800 text-white"
            >
              <UIcon
                :name="stat.icon"
                class="h-5 w-5"
              />
            </div>

            <div class="flex-1">
              <p class="font-medium">
                {{ stat.label }}
              </p>

              <p class="text-sm text-gray-500">Значение: {{ stat.value }}</p>
            </div>
          </div>

          <!-- Переключатель видимости -->
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-500">
              {{ stat.isPublic ? 'Публичная' : 'Приватная' }}
            </span>

            <USwitch
              :model-value="stat.isPublic"
              @update:model-value="
                (value) => {
                  stat.isPublic = value;
                  handleVisibilityChange(stat.key, value);
                }
              "
            />
          </div>
        </div>
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
