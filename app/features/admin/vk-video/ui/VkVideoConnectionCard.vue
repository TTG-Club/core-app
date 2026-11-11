<script setup lang="ts">
  import type { BadgeProps, ButtonProps } from '@nuxt/ui';

  import { useVkVideoConnection } from '../composables';
  import {
    VK_PROFILE_LABEL_PREFIX,
    VK_PROFILE_URL_BASE,
    VK_VIDEO_ADMIN_DATE_FORMAT,
    VK_VIDEO_ADMIN_TEXT,
    VK_VIDEO_ICONS,
  } from '../model';

  const {
    connection,
    loadError,
    status,
    isConnected,
    isConnecting,
    isDisconnecting,
    connect,
    disconnect,
  } = useVkVideoConnection();

  const { format } = useDayjs();

  const isDisconnectDialogOpen = ref(false);

  // idle наравне с pending: данные грузятся на клиенте, на первом рендере
  // статус ещё 'idle'.
  const isLoading = computed(
    () => status.value === 'idle' || status.value === 'pending',
  );

  const statusBadge = computed<BadgeProps>(() =>
    isConnected.value
      ? {
          color: 'success',
          icon: VK_VIDEO_ICONS.connected,
          label: VK_VIDEO_ADMIN_TEXT.connected,
        }
      : {
          color: 'neutral',
          icon: VK_VIDEO_ICONS.disconnected,
          label: VK_VIDEO_ADMIN_TEXT.disconnected,
        },
  );

  const connectButton = computed<ButtonProps>(() =>
    isConnected.value
      ? {
          label: VK_VIDEO_ADMIN_TEXT.reconnect,
          color: 'neutral',
          variant: 'soft',
        }
      : {
          label: VK_VIDEO_ADMIN_TEXT.connect,
          color: 'primary',
          variant: 'solid',
        },
  );

  const connectedAt = computed(() =>
    connection.value?.connectedAt
      ? format(connection.value.connectedAt, VK_VIDEO_ADMIN_DATE_FORMAT)
      : null,
  );

  const account = computed(() =>
    connection.value?.userId
      ? {
          url: `${VK_PROFILE_URL_BASE}${connection.value.userId}`,
          label: `${VK_PROFILE_LABEL_PREFIX}${connection.value.userId}`,
        }
      : null,
  );

  /** Открывает подтверждение отключения. */
  function openDisconnectDialog(): void {
    isDisconnectDialogOpen.value = true;
  }

  /** Закрывает подтверждение без отключения. */
  function closeDisconnectDialog(): void {
    isDisconnectDialogOpen.value = false;
  }

  /** Отключает ВК и закрывает подтверждение. */
  async function handleDisconnect(): Promise<void> {
    await disconnect();
    closeDisconnectDialog();
  }
</script>

<template>
  <div class="space-y-4 rounded-lg border border-default p-4">
    <USkeleton
      v-if="isLoading"
      class="h-20 w-full"
    />

    <UAlert
      v-else-if="loadError"
      color="error"
      variant="subtle"
      :icon="VK_VIDEO_ICONS.loadError"
      :title="VK_VIDEO_ADMIN_TEXT.loadError"
    />

    <template v-else>
      <UBadge
        v-bind="statusBadge"
        variant="subtle"
      />

      <dl
        v-if="isConnected"
        class="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[auto_1fr]"
      >
        <template v-if="account">
          <dt class="text-muted">
            {{ VK_VIDEO_ADMIN_TEXT.account }}
          </dt>

          <dd>
            <ULink
              :to="account.url"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary"
            >
              {{ account.label }}
            </ULink>
          </dd>
        </template>

        <template v-if="connectedAt">
          <dt class="text-muted">
            {{ VK_VIDEO_ADMIN_TEXT.connectedAt }}
          </dt>

          <dd>{{ connectedAt }}</dd>
        </template>
      </dl>

      <div class="flex flex-wrap gap-2">
        <UButton
          v-bind="connectButton"
          :icon="VK_VIDEO_ICONS.connect"
          :loading="isConnecting"
          @click.left.exact.prevent="connect"
        />

        <UButton
          v-if="isConnected"
          :icon="VK_VIDEO_ICONS.disconnect"
          :label="VK_VIDEO_ADMIN_TEXT.disconnect"
          color="error"
          variant="soft"
          @click.left.exact.prevent="openDisconnectDialog"
        />
      </div>
    </template>

    <UModal
      v-model:open="isDisconnectDialogOpen"
      :title="VK_VIDEO_ADMIN_TEXT.disconnect"
      :description="VK_VIDEO_ADMIN_TEXT.disconnectConfirm"
    >
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            :label="VK_VIDEO_ADMIN_TEXT.cancel"
            @click.left.exact.prevent="closeDisconnectDialog"
          />

          <UButton
            color="error"
            :label="VK_VIDEO_ADMIN_TEXT.disconnect"
            :loading="isDisconnecting"
            @click.left.exact.prevent="handleDisconnect"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
