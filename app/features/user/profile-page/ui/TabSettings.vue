<template>
  <div class="space-y-6">
    <!-- Настройки сайта -->
    <UCard :ui="{ header: 'px-6 py-4', body: 'p-6' }">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-fluent-settings-24-regular"
            class="h-5 w-5 text-primary-500"
          />

          <h3 class="font-semibold text-white">Настройки сайта</h3>
        </div>
      </template>

      <div class="max-w-xl space-y-6">
        <div class="text-sm text-gray-500">
          Здесь будут настройки фильтров и отображения контента.
        </div>
      </div>
    </UCard>
  </div>
</template>
