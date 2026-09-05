<script setup lang="ts">
  import type { FindGameNotification } from '../model';

  import { UiResult } from '~ui/result';

  import { useFindGameNotifications } from '../composables';
  import {
    getGameRoute,
    NOTIFICATION_ICONS,
    NOTIFICATION_TEXTS,
    NOTIFICATIONS_EMPTY_DESCRIPTION,
    NOTIFICATIONS_EMPTY_TITLE,
    NOTIFICATIONS_READ_ALL_LABEL,
    NOTIFICATIONS_TITLE,
  } from '../model';

  /**
   * Колокольчик раздела: показывает, в каких играх есть новости. Внутри
   * каждой игры — её события, свежие сверху.
   */
  const { games, isLoading, read, readAll, unread } =
    useFindGameNotifications();

  const { format } = useDayjs();

  const isOpen = ref(false);

  /**
   * Открывает игру и отмечает уведомление прочитанным: раз новость увидели,
   * держать её непрочитанной незачем.
   * @param notification Уведомление, по которому перешли.
   */
  async function open(notification: FindGameNotification): Promise<void> {
    isOpen.value = false;

    await navigateTo(getGameRoute(notification.gameId));

    if (!notification.readAt) {
      await read(notification.id);
    }
  }
</script>

<template>
  <UPopover v-model:open="isOpen">
    <UButton
      color="neutral"
      variant="ghost"
      icon="tabler:bell"
      square
      :aria-label="NOTIFICATIONS_TITLE"
    >
      <template
        v-if="unread"
        #trailing
      >
        <UBadge
          color="primary"
          variant="solid"
          size="sm"
          :label="String(unread)"
        />
      </template>
    </UButton>

    <template #content>
      <div class="flex max-h-96 w-80 flex-col gap-2 overflow-y-auto p-3">
        <div class="flex items-center justify-between gap-2">
          <span class="font-semibold text-highlighted">
            {{ NOTIFICATIONS_TITLE }}
          </span>

          <UButton
            v-if="unread"
            size="xs"
            color="neutral"
            variant="ghost"
            :label="NOTIFICATIONS_READ_ALL_LABEL"
            @click.left.exact.prevent="readAll"
          />
        </div>

        <USkeleton
          v-if="isLoading"
          class="h-20 w-full rounded-md"
        />

        <UiResult
          v-else-if="!games.length"
          status="info"
          :title="NOTIFICATIONS_EMPTY_TITLE"
          :sub-title="NOTIFICATIONS_EMPTY_DESCRIPTION"
        />

        <template v-else>
          <div
            v-for="game in games"
            :key="game.gameId"
            class="flex flex-col gap-1"
          >
            <div class="flex items-center gap-1.5">
              <span class="line-clamp-1 text-sm font-medium text-toned">
                {{ game.gameTitle }}
              </span>

              <UBadge
                v-if="game.unread"
                color="primary"
                variant="subtle"
                size="sm"
                :label="String(game.unread)"
              />
            </div>

            <button
              v-for="notification in game.items"
              :key="notification.id"
              type="button"
              class="flex items-start gap-2 rounded-md p-2 text-left hover:bg-elevated"
              :class="notification.readAt ? 'text-muted' : 'text-default'"
              @click.left.exact.prevent="open(notification)"
            >
              <UIcon
                :name="NOTIFICATION_ICONS[notification.type]"
                class="mt-0.5 size-4 shrink-0"
                :class="notification.readAt ? 'text-dimmed' : 'text-primary'"
              />

              <span class="flex min-w-0 flex-col">
                <span class="text-sm">
                  {{ NOTIFICATION_TEXTS[notification.type] }}
                </span>

                <span class="line-clamp-1 text-xs text-muted">
                  {{ notification.sessionTitle ?? game.gameTitle }} ·
                  {{ format(notification.createdAt, 'LLL') }}
                </span>
              </span>
            </button>
          </div>
        </template>
      </div>
    </template>
  </UPopover>
</template>
