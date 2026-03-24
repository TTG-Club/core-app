<script setup lang="ts">
  import type { ConnectedSocial } from '../model';

  defineProps<{
    connection: ConnectedSocial;
  }>();

  defineEmits<{
    connect: [id: string];
    disconnect: [id: string, name: string];
  }>();
</script>

<template>
  <div
    class="hover:border-accent flex items-center justify-between gap-4 rounded-lg border border-muted bg-elevated p-4 transition-colors"
    role="listitem"
  >
    <!-- Иконка и информация -->
    <div class="flex flex-1 items-center gap-3">
      <div
        class="bg-surface flex h-10 w-10 items-center justify-center rounded-lg"
        aria-hidden="true"
      >
        <UIcon
          :name="connection.icon"
          :style="{ color: connection.color }"
          class="h-6 w-6"
        />
      </div>

      <div class="flex-1">
        <p class="font-medium">
          {{ connection.name }}
        </p>

        <p class="text-sm text-muted">
          {{
            connection.isConnected && connection.username
              ? connection.username
              : 'Не подключено'
          }}
        </p>
      </div>
    </div>

    <!-- Кнопка действия -->
    <UButton
      v-if="connection.isConnected"
      color="error"
      variant="outline"
      size="sm"
      :aria-label="`Отключить ${connection.name}`"
      @click.left.exact.prevent="
        $emit('disconnect', connection.id, connection.name)
      "
    >
      Отключить
    </UButton>

    <UButton
      v-else
      color="primary"
      variant="outline"
      size="sm"
      :aria-label="`Подключить ${connection.name}`"
      @click.left.exact.prevent="$emit('connect', connection.id)"
    >
      Подключить
    </UButton>
  </div>
</template>
