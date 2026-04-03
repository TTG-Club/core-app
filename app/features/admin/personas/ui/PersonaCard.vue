<script setup lang="ts">
  import type {
    NotificationAdminResponse,
    NotificationTypeOption,
    PersonaResponse,
  } from '../model';

  import {
    extractNotificationText,
    NOTIFICATION_POLL_INTERVAL_MS,
    NOTIFICATION_TEXT_PREVIEW_MAX_LENGTH,
  } from '../model';

  const props = defineProps<{
    persona: PersonaResponse;
    notificationTypes: NotificationTypeOption[];
  }>();

  const emit = defineEmits<{
    'edit-name': [];
    'edited': [];
    'deleted': [];
  }>();

  const toast = useToast();

  // --- Состояние (активность, удаление) ---

  async function togglePersonaState(isActive: boolean) {
    try {
      await $fetch(`/api/v2/persona/${props.persona.id}`, {
        method: 'PUT',
        body: {
          ...props.persona,
          disabled: !isActive,
        },
      });

      emit('edited');
    } catch (error) {
      consola.error('Failed to toggle persona state:', error);
      toast.add({ title: 'Ошибка', color: 'error' });
    }
  }

  const isDeleting = ref(false);

  async function deletePersona() {
    isDeleting.value = true;

    try {
      await $fetch(`/api/v2/persona/${props.persona.id}`, {
        method: 'DELETE',
      });

      toast.add({ title: 'Персона удалена', color: 'success' });
      emit('deleted');
    } catch (error) {
      consola.error('Failed to delete persona:', error);
      toast.add({ title: 'Ошибка при удалении', color: 'error' });
    } finally {
      isDeleting.value = false;
    }
  }

  // --- Загрузка / удаление изображения ---

  const {
    open: openImageDialog,
    onChange: onImageDialogChange,
    onCancel: onImageDialogCancel,
    reset: resetImageDialog,
  } = useFileDialog({
    accept: 'image/webp, image/jpeg, image/png',
    multiple: false,
  });

  const isUploadingImage = ref(false);
  const isDeletingImage = ref(false);

  function triggerImageUpload() {
    resetImageDialog();
    openImageDialog();
  }

  onImageDialogChange(async (files) => {
    const file = files?.[0];

    if (!file) {
      return;
    }

    isUploadingImage.value = true;

    try {
      const formData = new FormData();

      formData.append('file', file);

      const response = await $fetch<{ url: string }>(
        '/s3/upload?section=persona',
        {
          method: 'POST',
          body: formData,
        },
      );

      await $fetch(`/api/v2/persona/${props.persona.id}`, {
        method: 'PUT',
        body: {
          name: props.persona.name,
          image: response.url,
          disabled: props.persona.disabled,
          username: props.persona.username,
        },
      });

      emit('edited');
      toast.add({ title: 'Изображение загружено', color: 'success' });
    } catch (error) {
      consola.error('Failed to upload image:', error);
      toast.add({ title: 'Ошибка при загрузке', color: 'error' });
    } finally {
      isUploadingImage.value = false;
      resetImageDialog();
    }
  });

  onImageDialogCancel(() => {
    isUploadingImage.value = false;
  });

  async function deleteImage() {
    if (!props.persona.image) {
      return;
    }

    isDeletingImage.value = true;

    try {
      await $fetch(props.persona.image, { method: 'DELETE' }).catch(() => {});

      await $fetch(`/api/v2/persona/${props.persona.id}`, {
        method: 'PUT',
        body: {
          name: props.persona.name,
          image: '',
          disabled: props.persona.disabled,
          username: props.persona.username,
        },
      });

      emit('edited');
      toast.add({ title: 'Изображение удалено', color: 'success' });
    } catch (error) {
      consola.error('Failed to delete image:', error);
      toast.add({ title: 'Ошибка при удалении', color: 'error' });
    } finally {
      isDeletingImage.value = false;
    }
  }

  // --- Нотификации (фразы) ---

  const notifications = ref<NotificationAdminResponse[]>([]);
  const deletingNotificationId = ref<number | null>(null);

  async function loadNotifications() {
    try {
      const data = await $fetch<NotificationAdminResponse[]>(
        `/api/v2/notification/persona/${props.persona.id}`,
      );

      notifications.value = (data || []).sort(
        (first, second) => first.id - second.id,
      );
    } catch (error) {
      consola.error(
        `Failed to load notifications for persona ${props.persona.id}:`,
        error,
      );
    }
  }

  onMounted(loadNotifications);

  useIntervalFn(() => {
    if (!document.hidden) {
      loadNotifications();
    }
  }, NOTIFICATION_POLL_INTERVAL_MS);

  async function deleteNotification(notificationId: number) {
    deletingNotificationId.value = notificationId;

    try {
      await $fetch(`/api/v2/notification?id=${notificationId}`, {
        method: 'DELETE',
      });

      toast.add({ title: 'Фраза удалена', color: 'success' });
      await loadNotifications();
    } catch (error) {
      consola.error('Failed to delete notification:', error);
      toast.add({ title: 'Ошибка при удалении фразы', color: 'error' });
    } finally {
      deletingNotificationId.value = null;
    }
  }

  function getNotificationTypeLabel(typeValue: string): string {
    return (
      props.notificationTypes.find((opt) => opt.value === typeValue)?.label
      || typeValue
    );
  }

  function formatNotifPreview(rawText: unknown): string {
    const text = extractNotificationText(rawText);

    return text.length > NOTIFICATION_TEXT_PREVIEW_MAX_LENGTH
      ? `${text.slice(0, NOTIFICATION_TEXT_PREVIEW_MAX_LENGTH)}...`
      : text;
  }

  // --- Шторка редактирования фразы ---

  const isDrawerOpen = ref(false);
  const activeNotification = ref<NotificationAdminResponse | null>(null);

  function openAddDrawer() {
    activeNotification.value = null;
    isDrawerOpen.value = true;
  }

  function openEditDrawer(notif: NotificationAdminResponse) {
    activeNotification.value = notif;
    isDrawerOpen.value = true;
  }

  async function handleNotificationSaved() {
    await loadNotifications();
  }

  defineExpose({ loadNotifications });
</script>

<template>
  <div
    class="space-y-4 rounded-lg border border-default p-4 transition-opacity"
    :class="{ 'opacity-60': persona.disabled }"
  >
    <!-- Шапка: переключатель, имя, дата, удаление -->
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <USwitch
          size="sm"
          :model-value="!persona.disabled"
          @update:model-value="togglePersonaState"
        />

        <div class="group flex items-center gap-1">
          <h3 class="text-base font-semibold text-highlighted">
            {{ persona.name }}
          </h3>

          <UButton
            variant="ghost"
            size="xs"
            icon="tabler:pencil"
            color="neutral"
            class="text-neutral-500 opacity-0 transition-opacity group-hover:opacity-100"
            @click.left.exact.prevent="$emit('edit-name')"
          />
        </div>
      </div>

      <div class="flex items-center gap-3">
        <span class="text-sm text-neutral-500">
          {{ persona.username }} ·
          {{ useDateFormat(persona.createdAt, 'DD.MM.YYYY').value }}
        </span>

        <UButton
          icon="tabler:trash"
          color="error"
          variant="ghost"
          size="xs"
          :loading="isDeleting"
          @click.left.exact.prevent="deletePersona"
        />
      </div>
    </div>

    <!-- Контент: список фраз + аватар -->
    <div class="grid grid-cols-[1fr_auto] gap-6">
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
              @click.left.exact.prevent="openAddDrawer"
            />
          </div>
        </template>

        <div
          v-if="notifications.length"
          class="flex max-h-96 flex-col gap-1 overflow-y-auto p-1"
        >
          <div
            v-for="notif in notifications"
            :key="notif.id"
            class="cursor-pointer rounded-md border border-default px-2.5 py-1.5 transition-colors hover:bg-elevated"
            :class="{ 'opacity-60': notif.disabled }"
            @click="openEditDrawer(notif)"
          >
            <div class="flex items-center gap-2">
              <p class="flex-1 truncate text-sm text-neutral-300">
                {{ formatNotifPreview(notif.text) }}
              </p>

              <UButton
                icon="tabler:trash"
                variant="ghost"
                size="xs"
                color="error"
                :loading="deletingNotificationId === notif.id"
                @click.stop="deleteNotification(notif.id)"
              />
            </div>

            <div
              class="mt-0.5 flex items-center justify-between text-xs text-neutral-500"
            >
              <div class="flex items-center gap-3">
                <span>{{
                  notif.typeName || getNotificationTypeLabel(notif.type)
                }}</span>

                <span v-if="notif.view">
                  <UIcon
                    name="tabler:eye"
                    class="mr-0.5 inline-block size-3"
                  />
                  {{ notif.view }}
                </span>

                <span v-if="notif.after || notif.before">
                  <UIcon
                    name="tabler:calendar"
                    class="mr-0.5 inline-block size-3"
                  />
                  {{
                    notif.after
                      ? useDateFormat(notif.after, 'DD.MM.YY').value
                      : '...'
                  }}
                  —
                  {{
                    notif.before
                      ? useDateFormat(notif.before, 'DD.MM.YY').value
                      : '...'
                  }}
                </span>

                <span
                  v-if="notif.disabled"
                  class="text-error"
                >
                  Отключено
                </span>
              </div>

              <div class="flex items-center gap-2">
                <span
                  v-if="notif.username"
                  class="flex items-center gap-1"
                >
                  <UIcon
                    name="tabler:user"
                    class="size-3"
                  />
                  {{ notif.username }}
                </span>

                <span
                  v-if="notif.createdAt"
                  class="text-neutral-600"
                >
                  {{ useDateFormat(notif.createdAt, 'DD.MM.YY').value }}
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

      <!-- Аватар персоны -->
      <div
        class="flex size-[220px] shrink-0 items-center justify-center rounded-md border border-dashed border-default"
      >
        <template v-if="persona.image">
          <div class="group relative size-full overflow-hidden rounded-md">
            <img
              :src="persona.image"
              class="size-full object-cover transition-opacity"
              :class="{ 'opacity-50': isDeletingImage }"
              alt="Аватар персоны"
            />

            <div
              class="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/50 opacity-0 transition-all duration-200"
              :class="{
                'opacity-100': isDeletingImage,
                'group-hover:opacity-100': !isDeletingImage,
              }"
              title="Удалить картинку"
              @click.left.exact.prevent="deleteImage"
            >
              <UIcon
                v-if="isDeletingImage"
                name="tabler:loader-2"
                class="size-8 animate-spin text-white"
              />

              <UIcon
                v-else
                name="tabler:trash"
                class="size-8 text-white transition-colors hover:text-error"
              />
            </div>
          </div>
        </template>

        <div
          v-else
          class="flex flex-col items-center gap-3 text-neutral-500"
        >
          <div class="flex flex-col items-center gap-1">
            <UIcon
              name="tabler:photo"
              class="size-10"
            />

            <span class="text-sm">Нет изображения</span>
          </div>

          <UButton
            size="sm"
            variant="soft"
            :loading="isUploadingImage"
            @click.left.exact.prevent="triggerImageUpload"
          >
            Загрузить
          </UButton>
        </div>
      </div>
    </div>

    <!-- Шторка фразы -->
    <PersonaNotificationDrawer
      v-model:open="isDrawerOpen"
      :persona="persona"
      :notification="activeNotification"
      :notification-types="notificationTypes"
      @saved="handleNotificationSaved"
    />
  </div>
</template>
