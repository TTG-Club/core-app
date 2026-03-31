<script setup lang="ts">
  import type { ConnectedSocial } from '../model';

  import { ProfileCardUI } from '../model';
  import ConnectionItem from './ConnectionItem.vue';

  defineProps<{
    connections: ConnectedSocial[];
  }>();

  defineEmits<{
    connect: [id: string];
    disconnect: [id: string, name: string];
  }>();
</script>

<template>
  <UCard :ui="ProfileCardUI">
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon
          name="tabler:plug-connected"
          class="h-5 w-5 text-primary"
          aria-hidden="true"
        />

        <h3 class="font-semibold text-primary">Подключенные аккаунты</h3>
      </div>
    </template>

    <div
      v-if="isDev"
      class="space-y-4"
      role="list"
      aria-label="Подключенные социальные сети"
    >
      <ConnectionItem
        v-for="connection in connections"
        :key="connection.id"
        :connection="connection"
        @connect="(id) => $emit('connect', id)"
        @disconnect="(id, name) => $emit('disconnect', id, name)"
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
        title="Подключенные аккаунты"
        description="Функция будет доступна в будущих обновлениях"
      />
    </div>
  </UCard>
</template>
