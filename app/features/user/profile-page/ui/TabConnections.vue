<script setup lang="ts">
  import { SocialConnections } from '../model';

  import type { ConnectedSocial } from '../model';

  /**
   * Подключенные социальные сети (временные данные)
   */
  const connections = ref<ConnectedSocial[]>(
    SocialConnections.map((social) => ({
      id: social.id,
      name: social.name,
      icon: social.icon,
      color: social.color,
      isConnected: false,
      username: undefined,
    })),
  );

  /**
   * Обработчик подключения социальной сети
   */
  function handleConnect(_id: string) {
    // TODO: Реализовать подключение через API
  }

  /**
   * Обработчик отключения социальной сети
   */
  function handleDisconnect(_id: string) {
    // TODO: Реализовать отключение через API
  }
</script>

<template>
  <div class="space-y-6">
    <!-- Подключенные аккаунты -->
    <UCard :ui="{ header: 'px-6 py-4', body: 'p-6' }">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-fluent-plug-connected-24-regular"
            class="h-5 w-5 text-primary-500"
          />

          <h3 class="font-semibold text-primary">Подключенные аккаунты</h3>
        </div>
      </template>

      <div class="space-y-4">
        <div
          v-for="connection in connections"
          :key="connection.id"
          class="hover:border-accent flex items-center justify-between gap-4 rounded-lg border border-muted bg-elevated p-4 transition-colors"
        >
          <!-- Иконка и информация -->
          <div class="flex flex-1 items-center gap-3">
            <div
              class="bg-surface flex h-10 w-10 items-center justify-center rounded-lg"
            >
              <UIcon
                :name="connection.icon"
                :class="connection.color"
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
            @click.left.exact.prevent="handleDisconnect(connection.id)"
          >
            Отключить
          </UButton>

          <UButton
            v-else
            color="primary"
            variant="outline"
            size="sm"
            @click.left.exact.prevent="handleConnect(connection.id)"
          >
            Подключить
          </UButton>
        </div>
      </div>
    </UCard>

    <!-- Информация -->
    <UCard :ui="{ body: 'p-6' }">
      <UAlert
        icon="i-fluent-plug-connected-24-regular"
        color="neutral"
        variant="subtle"
        title="О подключениях"
        description="Подключите свои аккаунты в социальных сетях для быстрого входа и дополнительных возможностей."
      />
    </UCard>
  </div>
</template>
