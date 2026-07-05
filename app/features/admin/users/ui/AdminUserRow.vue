<script setup lang="ts">
  import type { AdminUserResponse } from '../model';

  import {
    ADMIN_USERS_EMAIL_NOT_VERIFIED_BADGE,
    ADMIN_USERS_EMAIL_VERIFIED_BADGE,
    ADMIN_USERS_NO_ROLES_LABEL,
  } from '../model';

  const { user, isOpened } = defineProps<{
    user: AdminUserResponse;
    isOpened?: boolean;
  }>();

  const emit = defineEmits<{
    select: [id: string];
  }>();
</script>

<template>
  <div
    class="flex cursor-pointer flex-row flex-wrap items-center justify-between gap-x-6 gap-y-2 rounded-xl border px-4 py-3 transition select-none"
    :class="[
      isOpened
        ? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary/50'
        : 'border-default bg-elevated hover:border-accented hover:bg-accented',
      { 'opacity-60': user.accountLocked },
    ]"
    @click.left.exact.prevent="emit('select', user.id)"
  >
    <!-- Слева: аватар-иконка + имя/email -->
    <div class="flex min-w-0 items-center gap-3">
      <span
        class="flex size-9 shrink-0 items-center justify-center rounded-full bg-elevated text-muted ring-1 ring-default"
        aria-hidden="true"
      >
        <UIcon
          name="tabler:user"
          class="size-5"
        />
      </span>

      <div class="flex min-w-0 flex-col">
        <span
          class="truncate text-sm font-semibold text-highlighted"
          :title="user.username"
        >
          {{ user.username }}
        </span>

        <span
          class="truncate text-xs text-muted"
          :title="user.email"
        >
          {{ user.email }}
        </span>
      </div>
    </div>

    <!-- Справа: роли + статусные иконки -->
    <div class="flex flex-wrap items-center justify-end gap-2">
      <template v-if="user.roles.length">
        <UBadge
          v-for="role in user.roles"
          :key="role"
          color="primary"
          variant="subtle"
          size="sm"
        >
          {{ role }}
        </UBadge>
      </template>

      <UBadge
        v-else
        color="neutral"
        variant="subtle"
        size="sm"
      >
        {{ ADMIN_USERS_NO_ROLES_LABEL }}
      </UBadge>

      <span class="hidden text-muted/30 sm:inline">|</span>

      <div class="flex items-center gap-2">
        <!-- Подтверждение email -->
        <UTooltip
          :text="
            user.emailVerified
              ? ADMIN_USERS_EMAIL_VERIFIED_BADGE
              : ADMIN_USERS_EMAIL_NOT_VERIFIED_BADGE
          "
        >
          <UIcon
            name="tabler:mail"
            class="size-5 transition-colors"
            :class="user.emailVerified ? 'text-success' : 'text-warning'"
          />
        </UTooltip>

        <!-- Блокировка аккаунта -->
        <UTooltip
          :text="
            user.accountLocked ? 'Аккаунт заблокирован' : 'Аккаунт активен'
          "
        >
          <UIcon
            name="tabler:lock"
            class="size-5 transition-colors"
            :class="user.accountLocked ? 'text-error' : 'text-muted/30'"
          />
        </UTooltip>
      </div>
    </div>
  </div>
</template>
