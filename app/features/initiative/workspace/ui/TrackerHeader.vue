<script setup lang="ts">
  import type { TrackerDetailed } from '~initiative/model';

  import {
    INITIATIVE_TOOL_ROUTE,
    MAX_TRACKER_NAME_LENGTH,
    TRACKER_STATUS_BADGE,
  } from '~initiative/model';
  import { ConfirmDialog } from '~initiative/ui-kit';

  const {
    tracker,
    isAnonymous = false,
    isMutating = false,
  } = defineProps<{
    tracker: TrackerDetailed;
    isAnonymous?: boolean;
    isMutating?: boolean;
  }>();

  const emit = defineEmits<{
    'rename': [name: string];
    'remove': [];
    'create-new': [];
    'create-another': [];
  }>();

  const isRenameOpen = ref(false);
  const isDeleteOpen = ref(false);
  const isReplaceOpen = ref(false);
  const renameValue = ref(tracker.name);

  const badge = computed(() => TRACKER_STATUS_BADGE[tracker.status]);

  const deleteDescription = computed(() =>
    isAnonymous
      ? `Трекер «${tracker.name}» будет удалён безвозвратно.`
      : `Трекер «${tracker.name}» переедет в историю.`,
  );

  // Синхронизируем поле переименования, если имя изменилось извне и модалка
  // закрыта (не затираем ввод пользователя).
  watch(
    () => tracker.name,
    (value) => {
      if (!isRenameOpen.value) {
        renameValue.value = value;
      }
    },
  );

  function openRename(): void {
    renameValue.value = tracker.name;
    isRenameOpen.value = true;
  }

  function submitRename(): void {
    const name = renameValue.value.trim();

    if (!name) {
      return;
    }

    emit('rename', name);
    isRenameOpen.value = false;
  }

  function confirmDelete(): void {
    isDeleteOpen.value = false;
    emit('remove');
  }

  function confirmReplace(): void {
    isReplaceOpen.value = false;
    emit('create-new');
  }
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <UButton
      v-if="!isAnonymous"
      :to="INITIATIVE_TOOL_ROUTE"
      icon="tabler:arrow-left"
      color="neutral"
      variant="ghost"
      aria-label="К списку трекеров"
    />

    <!-- Имя боя нужно только авторизованным (у них список трекеров);
         анониму оно ни к чему — показываем только статус и действия. -->
    <div
      v-if="!isAnonymous"
      class="flex min-w-0 items-center gap-1"
    >
      <h2 class="truncate text-xl font-semibold text-highlighted">
        {{ tracker.name }}
      </h2>

      <UButton
        icon="tabler:pencil"
        size="xs"
        color="neutral"
        variant="ghost"
        :disabled="isMutating"
        aria-label="Переименовать трекер"
        @click.left.exact.prevent="openRename"
      />
    </div>

    <UBadge
      :color="badge.color"
      variant="subtle"
      :icon="badge.icon"
    >
      {{ tracker.statusName }}
    </UBadge>

    <UBadge
      v-if="tracker.status === 'ACTIVE'"
      color="neutral"
      variant="subtle"
    >
      Раунд {{ tracker.round }}
    </UBadge>

    <div class="ml-auto flex flex-wrap justify-end gap-1">
      <UButton
        v-if="!isAnonymous"
        icon="tabler:plus"
        color="neutral"
        variant="ghost"
        :disabled="isMutating"
        @click.left.exact.prevent="emit('create-another')"
      >
        Собрать ещё бой
      </UButton>

      <UButton
        v-if="isAnonymous"
        icon="tabler:plus"
        color="neutral"
        variant="ghost"
        :disabled="isMutating"
        @click.left.exact.prevent="isReplaceOpen = true"
      >
        Новый
      </UButton>

      <UButton
        icon="tabler:trash"
        color="error"
        variant="ghost"
        :disabled="isMutating"
        aria-label="Удалить трекер"
        @click.left.exact.prevent="isDeleteOpen = true"
      />
    </div>

    <UModal
      v-model:open="isRenameOpen"
      title="Переименовать трекер"
    >
      <template #body>
        <form
          class="flex flex-col gap-4"
          @submit.prevent="submitRename"
        >
          <UInput
            v-model="renameValue"
            :maxlength="MAX_TRACKER_NAME_LENGTH"
            placeholder="Название трекера"
            autofocus
          />

          <div class="flex justify-end gap-2">
            <UButton
              variant="ghost"
              color="neutral"
              @click.left.exact.prevent="isRenameOpen = false"
            >
              Отмена
            </UButton>

            <UButton
              type="submit"
              :disabled="!renameValue.trim()"
            >
              Сохранить
            </UButton>
          </div>
        </form>
      </template>
    </UModal>

    <ConfirmDialog
      v-model:open="isDeleteOpen"
      title="Удалить трекер?"
      :description="deleteDescription"
      confirm-label="Удалить"
      confirm-color="error"
      confirm-icon="tabler:trash"
      @confirm="confirmDelete"
    />

    <ConfirmDialog
      v-model:open="isReplaceOpen"
      title="Создать новый трекер?"
      description="Текущий анонимный трекер будет заменён новым — старый удалится безвозвратно."
      confirm-label="Создать новый"
      confirm-icon="tabler:plus"
      @confirm="confirmReplace"
    />
  </div>
</template>
