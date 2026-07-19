<script setup lang="ts">
  const items = [
    {
      slot: 'actions',
      label: 'Действия',
    },
    {
      slot: 'spells',
      label: 'Заклинания',
    },
    {
      slot: 'equipment',
      label: 'Снаряжение',
    },
    {
      slot: 'features',
      label: 'Особенности',
    },
    {
      slot: 'effects',
      label: 'Эффекты',
    },
    {
      slot: 'notes',
      label: 'Заметки',
    },
  ];
</script>

<template>
  <div class="flex flex-col gap-4">
    <UTabs
      :items="items"
      class="w-full"
    >
      <template #default="{ item }">
        <div class="relative flex items-center gap-2 truncate">
          <span class="truncate">{{ item.label }}</span>
        </div>
      </template>

      <!-- Actions Tab -->
      <template #actions>
        <div
          class="min-h-96 rounded-lg border border-default/50 bg-elevated/20 p-4"
        >
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-sm font-bold text-muted uppercase">Действия</h3>

            <UButton
              size="xs"
              color="neutral"
              variant="ghost"
              icon="i-ttg-plus"
              label="Добавить"
            />
          </div>
          <!-- Placeholder content -->
          <div
            class="flex h-full items-center justify-center text-sm text-dimmed"
          >
            Список действий пуст
          </div>
        </div>
      </template>

      <!-- Spells Tab -->
      <template #spells>
        <div
          class="flex h-96 items-center justify-center rounded-lg border border-default bg-elevated/20 p-4 text-sm text-dimmed"
        >
          Книга заклинаний пуста
        </div>
      </template>

      <!-- Equipment Tab -->
      <template #equipment>
        <div
          class="flex h-96 items-center justify-center rounded-lg border border-default bg-elevated/20 p-4 text-sm text-dimmed"
        >
          Инвентарь пуст
        </div>
      </template>

      <!-- Features Tab -->
      <template #features>
        <div
          class="flex h-96 items-center justify-center rounded-lg border border-default bg-elevated/20 p-4 text-sm text-dimmed"
        >
          Нет особенностей
        </div>
      </template>

      <!-- Effects Tab -->
      <template #effects>
        <div
          class="flex h-96 items-center justify-center rounded-lg border border-default bg-elevated/20 p-4 text-sm text-dimmed"
        >
          Нет активных эффектов
        </div>
      </template>

      <!-- Notes Tab -->
      <template #notes>
        <div
          class="flex h-96 items-center justify-center rounded-lg border border-default bg-elevated/20 p-4 text-sm text-dimmed"
        >
          Нет заметок
        </div>
      </template>
    </UTabs>
  </div>
</template>
