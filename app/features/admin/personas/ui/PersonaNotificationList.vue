<script setup lang="ts">
  import type { NotificationAdminResponse } from '../model';

  import { FetchError } from 'ofetch';

  import { NOTIFICATION_TEXT_PREVIEW_MAX_LENGTH } from '../model';

  const { personaId } = defineProps<{
    personaId: string;
  }>();

  defineEmits<{
    'edit-notification': [notification: NotificationAdminResponse];
    'add-notification': [];
  }>();

  const toast = useToast();

  const { data: notifications, refresh: refreshNotifications } = useAsyncData<
    NotificationAdminResponse[]
  >(
    `persona-notifications-${personaId}`,
    () => $fetch(`/api/v2/notification/persona/${personaId}`),
    {
      server: false,
      default: () => [],
      transform: (data) =>
        [...(data || [])].sort((first, second) => first.id - second.id),
    },
  );

  const deletingNotificationId = ref<number | null>(null);

  function formatPreview(text: string): string {
    return text.length > NOTIFICATION_TEXT_PREVIEW_MAX_LENGTH
      ? `${text.slice(0, NOTIFICATION_TEXT_PREVIEW_MAX_LENGTH)}...`
      : text;
  }

  function formatDateRange(notification: NotificationAdminResponse): string {
    const after = notification.after
      ? useDateFormat(notification.after, 'DD.MM.YY').value
      : '...';

    const before = notification.before
      ? useDateFormat(notification.before, 'DD.MM.YY').value
      : '...';

    return `${after} — ${before}`;
  }

  async function deleteNotification(notificationId: number) {
    deletingNotificationId.value = notificationId;

    try {
      await $fetch('/api/v2/notification', {
        method: 'DELETE',
        query: { id: notificationId },
      });

      toast.add({ title: 'Фраза удалена', color: 'success' });
      await refreshNotifications();
    } catch (error) {
      const message =
        error instanceof FetchError
          ? error.data?.message || error.message
          : 'Неизвестная ошибка';

      toast.add({
        title: 'Ошибка при удалении фразы',
        description: message,
        color: 'error',
      });
    } finally {
      deletingNotificationId.value = null;
    }
  }
</script>

<template>
  <UCard
    variant="subtle"
    :ui="{ header: 'px-3 py-2 sm:px-3 sm:py-2', body: 'p-2 sm:p-2' }"
  >
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="truncate text-sm font-medium text-highlighted">
          Список фраз
        </h3>

        <UButton
          icon="tabler:plus"
          variant="ghost"
          size="xs"
          color="neutral"
          @click.left.exact.prevent="$emit('add-notification')"
        />
      </div>
    </template>

    <div
      v-if="notifications.length"
      class="flex max-h-96 flex-col gap-1 overflow-y-auto p-1"
    >
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="cursor-pointer rounded-md border border-default px-2.5 py-1.5 transition-colors hover:bg-elevated"
        :class="{ 'opacity-60': notification.disabled }"
        @click="$emit('edit-notification', notification)"
      >
        <div class="flex items-center gap-2">
          <p class="flex-1 truncate text-sm text-neutral-300">
            {{ formatPreview(notification.text) }}
          </p>

          <UButton
            icon="tabler:trash"
            variant="ghost"
            size="xs"
            color="error"
            :loading="deletingNotificationId === notification.id"
            @click.stop="deleteNotification(notification.id)"
          />
        </div>

        <div
          class="mt-0.5 flex items-center justify-between text-xs text-neutral-500"
        >
          <div class="flex items-center gap-3">
            <span>{{ notification.typeName || notification.type }}</span>

            <span v-if="notification.view">
              <UIcon
                name="tabler:eye"
                class="mr-0.5 inline-block size-3"
              />
              {{ notification.view }}
            </span>

            <span v-if="notification.after || notification.before">
              <UIcon
                name="tabler:calendar"
                class="mr-0.5 inline-block size-3"
              />
              {{ formatDateRange(notification) }}
            </span>

            <span
              v-if="notification.disabled"
              class="text-error"
            >
              Отключено
            </span>
          </div>

          <div class="flex items-center gap-2">
            <span
              v-if="notification.username"
              class="flex items-center gap-1"
            >
              <UIcon
                name="tabler:user"
                class="size-3"
              />
              {{ notification.username }}
            </span>

            <span
              v-if="notification.createdAt"
              class="text-neutral-600"
            >
              {{ useDateFormat(notification.createdAt, 'DD.MM.YY').value }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div
      v-else
      class="px-3 py-4 text-center text-sm text-neutral-500"
    >
      Список пуст
    </div>
  </UCard>
</template>
