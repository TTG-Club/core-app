<script setup lang="ts">
  import type { UserBanActionResult } from '../composables';
  import type { AdminUserResponse } from '../model';

  import { useUserBan } from '../composables';
  import {
    ADMIN_USERS_BAN_CANCEL_LABEL,
    ADMIN_USERS_BAN_DIALOG_DESCRIPTION,
    ADMIN_USERS_BAN_DIALOG_TITLE,
    ADMIN_USERS_BAN_HIDE_COMMENTS_DESCRIPTION,
    ADMIN_USERS_BAN_HIDE_COMMENTS_LABEL,
    ADMIN_USERS_BAN_LABEL,
    ADMIN_USERS_BAN_PERMANENT_LABEL,
    ADMIN_USERS_BAN_REASON_LABEL,
    ADMIN_USERS_BAN_REASON_MAX_LENGTH,
    ADMIN_USERS_BAN_REASON_PLACEHOLDER,
    ADMIN_USERS_BAN_REASON_TITLE,
    ADMIN_USERS_BAN_SECTION_TITLE,
    ADMIN_USERS_BANNED_UNTIL_PREFIX,
    ADMIN_USERS_DATE_FORMAT,
    ADMIN_USERS_LOCKED_BADGE,
    ADMIN_USERS_UNBAN_DIALOG_DESCRIPTION,
    ADMIN_USERS_UNBAN_DIALOG_TITLE,
    ADMIN_USERS_UNBAN_LABEL,
    ADMIN_USERS_UNBAN_RESTORE_COMMENTS_DESCRIPTION,
    ADMIN_USERS_UNBAN_RESTORE_COMMENTS_LABEL,
  } from '../model';

  const props = defineProps<{
    user: AdminUserResponse;
  }>();

  const emit = defineEmits<{
    /** Пользователь обновлён (заблокирован или разблокирован). */
    'saved': [user: AdminUserResponse];

    /** Массовая операция изменила комментарии пользователя. */
    'comments-changed': [];
  }>();

  const { format } = useDayjs();

  const { isBanning, isUnbanning, ban, unban } = useUserBan(
    () => props.user.id,
  );

  const isDialogOpen = ref(false);
  const banReason = ref('');
  const hideComments = ref(false);
  const restoreComments = ref(false);

  /** Бан виден и по старому флагу, и по новому статусу auth-service. */
  const isBanned = computed(
    () => props.user.accountLocked || props.user.status === 'BANNED',
  );

  const isBusy = computed(() => isBanning.value || isUnbanning.value);

  const dialogTitle = computed(() =>
    isBanned.value
      ? ADMIN_USERS_UNBAN_DIALOG_TITLE
      : ADMIN_USERS_BAN_DIALOG_TITLE,
  );

  const dialogDescription = computed(() =>
    isBanned.value
      ? ADMIN_USERS_UNBAN_DIALOG_DESCRIPTION
      : ADMIN_USERS_BAN_DIALOG_DESCRIPTION,
  );

  const actionLabel = computed(() =>
    isBanned.value ? ADMIN_USERS_UNBAN_LABEL : ADMIN_USERS_BAN_LABEL,
  );

  const actionColor = computed<'success' | 'error'>(() =>
    isBanned.value ? 'success' : 'error',
  );

  const actionIcon = computed(() =>
    isBanned.value ? 'tabler:lock-open' : 'tabler:ban',
  );

  /** Срок блокировки: до конкретной даты либо бессрочная. */
  const bannedUntilLabel = computed(() =>
    props.user.bannedUntil
      ? `${ADMIN_USERS_BANNED_UNTIL_PREFIX} ${format(props.user.bannedUntil, ADMIN_USERS_DATE_FORMAT)}`
      : ADMIN_USERS_BAN_PERMANENT_LABEL,
  );

  function openDialog(): void {
    banReason.value = '';
    hideComments.value = false;
    restoreComments.value = false;
    isDialogOpen.value = true;
  }

  function closeDialog(): void {
    isDialogOpen.value = false;
  }

  /**
   * Общее завершение действия: обновляем пользователя наверху и, если
   * массовая операция прошла, просим перечитать список комментариев.
   * @param result Результат бана/разблокировки; `null` — операция не удалась.
   */
  function applyResult(result: UserBanActionResult | null): void {
    if (!result) {
      return;
    }

    emit('saved', result.user);

    if (result.affectedComments != null) {
      emit('comments-changed');
    }

    isDialogOpen.value = false;
  }

  async function confirmAction(): Promise<void> {
    if (isBanned.value) {
      applyResult(await unban({ restoreComments: restoreComments.value }));

      return;
    }

    applyResult(
      await ban({ reason: banReason.value, hideComments: hideComments.value }),
    );
  }
</script>

<template>
  <div class="space-y-3">
    <!-- Заголовок секции -->
    <div class="flex items-center gap-2">
      <UIcon
        name="tabler:ban"
        class="size-5 text-error"
        aria-hidden="true"
      />

      <span class="text-sm font-medium text-highlighted">
        {{ ADMIN_USERS_BAN_SECTION_TITLE }}
      </span>
    </div>

    <!-- Текущее состояние: срок и причина блокировки -->
    <div
      v-if="isBanned"
      class="space-y-2 rounded-lg border border-error/25 bg-error/5 p-3"
    >
      <div class="flex flex-wrap items-center gap-2">
        <UBadge
          color="error"
          variant="subtle"
          size="sm"
        >
          {{ ADMIN_USERS_LOCKED_BADGE }}
        </UBadge>

        <span class="text-xs text-muted">{{ bannedUntilLabel }}</span>
      </div>

      <p
        v-if="user.statusReason"
        class="text-sm text-highlighted"
      >
        <span class="text-muted">{{ ADMIN_USERS_BAN_REASON_TITLE }}:</span>
        {{ user.statusReason }}
      </p>
    </div>

    <UButton
      :icon="actionIcon"
      :color="actionColor"
      variant="soft"
      :loading="isBusy"
      @click.left.exact.prevent="openDialog"
    >
      {{ actionLabel }}
    </UButton>

    <!-- Диалог подтверждения с опцией массовой операции над комментариями -->
    <UModal
      v-model:open="isDialogOpen"
      :title="dialogTitle"
      :description="dialogDescription"
    >
      <template #body>
        <div class="space-y-4">
          <!-- Блокировка: причина и флаг скрытия комментариев -->
          <template v-if="!isBanned">
            <UFormField :label="ADMIN_USERS_BAN_REASON_LABEL">
              <UTextarea
                v-model="banReason"
                :placeholder="ADMIN_USERS_BAN_REASON_PLACEHOLDER"
                :maxlength="ADMIN_USERS_BAN_REASON_MAX_LENGTH"
                :rows="3"
                class="w-full"
              />
            </UFormField>

            <USwitch
              v-model="hideComments"
              color="error"
              :label="ADMIN_USERS_BAN_HIDE_COMMENTS_LABEL"
              :description="ADMIN_USERS_BAN_HIDE_COMMENTS_DESCRIPTION"
            />
          </template>

          <!-- Разблокировка: флаг восстановления комментариев -->
          <USwitch
            v-else
            v-model="restoreComments"
            color="success"
            :label="ADMIN_USERS_UNBAN_RESTORE_COMMENTS_LABEL"
            :description="ADMIN_USERS_UNBAN_RESTORE_COMMENTS_DESCRIPTION"
          />

          <div class="flex justify-end gap-2">
            <UButton
              variant="ghost"
              color="neutral"
              :disabled="isBusy"
              @click.left.exact.prevent="closeDialog"
            >
              {{ ADMIN_USERS_BAN_CANCEL_LABEL }}
            </UButton>

            <UButton
              :icon="actionIcon"
              :color="actionColor"
              :loading="isBusy"
              @click.left.exact.prevent="confirmAction"
            >
              {{ actionLabel }}
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
