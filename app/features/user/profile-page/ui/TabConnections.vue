<script setup lang="ts">
  import { useConfirmModal } from '../composables/useConfirmModal';
  import { useUserProfile } from '../composables/useUserProfile';
  import { ProfileCardUI, SocialConnections } from '../model';

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

  const { isLoading, connectSocial, disconnectSocial } = useUserProfile();
  const { confirm } = useConfirmModal();

  /**
   * Обработчик подключения социальной сети
   */
  async function handleConnect(id: string) {
    await connectSocial(id);
  }

  /**
   * Обработчик отключения социальной сети
   */
  async function handleDisconnect(id: string, name: string) {
    const confirmed = await confirm({
      title: `Отключить ${name}?`,
      description:
        'Вы больше не сможете использовать этот аккаунт для входа на сайт.',
      confirmLabel: 'Отключить',
      color: 'error',
    });

    if (confirmed) {
      await disconnectSocial(id);
    }
  }
</script>

<template>
  <div class="space-y-6">
    <!-- Подключенные аккаунты -->
    <UCard :ui="ProfileCardUI">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-fluent-plug-connected-24-regular"
            class="h-5 w-5 text-primary-500"
            aria-hidden="true"
          />

          <h3 class="font-semibold text-primary">Подключенные аккаунты</h3>
        </div>
      </template>

      <div
        class="space-y-4"
        role="list"
        aria-label="Подключенные социальные сети"
      >
        <div
          v-for="connection in connections"
          :key="connection.id"
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
            :disabled="isLoading"
            :aria-label="`Отключить ${connection.name}`"
            @click.left.exact.prevent="
              handleDisconnect(connection.id, connection.name)
            "
          >
            Отключить
          </UButton>

          <UButton
            v-else
            color="primary"
            variant="outline"
            size="sm"
            :disabled="isLoading"
            :loading="isLoading"
            :aria-label="`Подключить ${connection.name}`"
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
