<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type { TrackerListItem } from '~initiative/model';

  import {
    MAX_TRACKER_NAME_LENGTH,
    TRACKER_STATUS_BADGE,
  } from '~initiative/model';
  import { ConfirmDialog } from '~initiative/ui-kit';

  const {
    tracker,
    readonly = false,
    disabled = false,
  } = defineProps<{
    tracker: TrackerListItem;
    readonly?: boolean;
    disabled?: boolean;
  }>();

  const emit = defineEmits<{
    open: [id: string];
    rename: [id: string, name: string];
    remove: [id: string];
  }>();

  const { format } = useDayjs();

  const isRenameOpen = ref(false);
  const isDeleteOpen = ref(false);
  const renameValue = ref(tracker.name);

  const badge = computed(() => TRACKER_STATUS_BADGE[tracker.status]);
  const isActive = computed(() => tracker.status === 'ACTIVE');
  // Последняя активность (updatedAt) — полезнее даты создания для «продолжить бой».
  const activityLabel = computed(() => format(tracker.updatedAt, 'LLL'));

  // Карточка из истории (readonly) приглушена и без ховера; недоступная —
  // не кликается. Логика вынесена из шаблона в computed.
  const rowClass = computed(() => [
    readonly ? 'opacity-60' : 'hover:border-primary',
    disabled && 'pointer-events-none opacity-50',
  ]);

  const iconColorClass = computed(() =>
    readonly ? 'text-muted' : 'text-primary',
  );

  const menuItems = computed<Array<DropdownMenuItem>>(() => [
    {
      label: 'Переименовать',
      icon: 'tabler:pencil',
      onSelect: openRename,
    },
    {
      label: 'Удалить',
      icon: 'tabler:trash',
      color: 'error',
      onSelect: () => {
        isDeleteOpen.value = true;
      },
    },
  ]);

  function open(): void {
    if (readonly || disabled) {
      return;
    }

    emit('open', tracker.id);
  }

  function openRename(): void {
    renameValue.value = tracker.name;
    isRenameOpen.value = true;
  }

  function submitRename(): void {
    const name = renameValue.value.trim();

    if (!name) {
      return;
    }

    emit('rename', tracker.id, name);
    isRenameOpen.value = false;
  }

  function confirmRemove(): void {
    emit('remove', tracker.id);
    isDeleteOpen.value = false;
  }
</script>

<template>
  <div
    class="flex items-center gap-3 rounded-lg border border-default bg-default p-2.5 transition-colors"
    :class="rowClass"
  >
    <component
      :is="readonly ? 'div' : 'button'"
      type="button"
      class="flex min-w-0 flex-1 items-center gap-3 text-left"
      :class="!readonly && 'cursor-pointer'"
      @click.left.exact.prevent="open"
    >
      <UIcon
        :name="badge.icon"
        class="size-5 shrink-0"
        :class="iconColorClass"
      />

      <div class="flex min-w-0 flex-col">
        <span class="truncate text-sm font-semibold text-highlighted">
          {{ tracker.name }}
        </span>

        <span class="truncate text-xs text-secondary">
          {{ activityLabel }}
        </span>
      </div>
    </component>

    <div class="flex shrink-0 items-center gap-1.5">
      <UBadge
        v-if="readonly"
        color="neutral"
        variant="subtle"
        icon="tabler:trash"
      >
        В истории
      </UBadge>

      <template v-else>
        <UBadge
          v-if="isActive"
          color="neutral"
          variant="subtle"
        >
          Раунд {{ tracker.round }}
        </UBadge>

        <UBadge
          :color="badge.color"
          variant="subtle"
        >
          {{ tracker.statusName }}
        </UBadge>

        <UDropdownMenu :items="menuItems">
          <UButton
            icon="tabler:dots-vertical"
            color="neutral"
            variant="ghost"
            size="sm"
            :disabled
            aria-label="Действия с трекером"
          />
        </UDropdownMenu>
      </template>
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
      :description="`Трекер «${tracker.name}» переедет в историю.`"
      confirm-label="Удалить"
      confirm-color="error"
      confirm-icon="tabler:trash"
      @confirm="confirmRemove"
    />
  </div>
</template>
