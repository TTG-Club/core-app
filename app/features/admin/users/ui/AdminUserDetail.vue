<script setup lang="ts">
  import type {
    AdminRoleResponse,
    AdminRoleSelectItem,
    AdminUserResponse,
  } from '../model';

  import { FetchError } from 'ofetch';

  import { AdminUserComments } from '~comments/admin';

  import {
    ADMIN_USERS_ACTIVE_BADGE,
    ADMIN_USERS_CREDENTIALS_EXPIRED_BADGE,
    ADMIN_USERS_DATE_FORMAT,
    ADMIN_USERS_EMAIL_NOT_VERIFIED_BADGE,
    ADMIN_USERS_EMAIL_VERIFIED_BADGE,
    ADMIN_USERS_LOCKED_BADGE,
    ADMIN_USERS_ROLE_FIELD_LABEL,
    ADMIN_USERS_ROLE_PLACEHOLDER,
    ADMIN_USERS_ROLES_SECTION_TITLE,
    ADMIN_USERS_SAVE_ERROR_TOAST,
    ADMIN_USERS_SAVE_LABEL,
    ADMIN_USERS_SAVED_TOAST,
  } from '../model';
  import AdminUserBan from './AdminUserBan.vue';
  import AdminUserRedeemedCodes from './AdminUserRedeemedCodes.vue';
  import AdminUserSubscription from './AdminUserSubscription.vue';

  const props = defineProps<{
    roles: AdminRoleResponse[];
    user: AdminUserResponse;
  }>();

  const emit = defineEmits<{
    saved: [user: AdminUserResponse];
  }>();

  const toast = useToast();
  const { copy } = useCopyAndShare();
  const { format } = useDayjs();

  const selectedRoleIds = ref<number[]>([]);
  const isSaving = ref(false);

  /**
   * Версия списка комментариев: массовое скрытие/восстановление при бане
   * меняет статусы на сервере, смена `:key` перемонтирует блок и перечитывает
   * ленту (список грузится в onMounted).
   */
  const commentsListVersion = ref(0);

  function refreshComments(): void {
    commentsListVersion.value += 1;
  }

  function onUserSaved(updated: AdminUserResponse): void {
    emit('saved', updated);
  }

  const roleSelectItems = computed<AdminRoleSelectItem[]>(() => {
    return props.roles.map((role) => ({
      label: role.name,
      value: role.id,
    }));
  });

  const sortedSelectedRoleIds = computed(() => {
    return [...selectedRoleIds.value].sort((firstRoleId, secondRoleId) => {
      return firstRoleId - secondRoleId;
    });
  });

  const originalRoleIds = computed(() => {
    return getRoleIdsByNames(props.roles, props.user.roles);
  });

  const isSaveDisabled = computed(() => {
    return areRoleIdsEqual(sortedSelectedRoleIds.value, originalRoleIds.value);
  });

  const createdAtLabel = computed(() =>
    props.user.createdAt
      ? format(props.user.createdAt, ADMIN_USERS_DATE_FORMAT)
      : '—',
  );

  const updatedAtLabel = computed(() =>
    props.user.updatedAt
      ? format(props.user.updatedAt, ADMIN_USERS_DATE_FORMAT)
      : '—',
  );

  function getRoleIdsByNames(
    roles: AdminRoleResponse[],
    roleNames: string[],
  ): number[] {
    return roles
      .filter((role) => roleNames.includes(role.name))
      .map((role) => role.id)
      .sort((firstRoleId, secondRoleId) => firstRoleId - secondRoleId);
  }

  function areRoleIdsEqual(
    firstRoleIds: number[],
    secondRoleIds: number[],
  ): boolean {
    if (firstRoleIds.length !== secondRoleIds.length) {
      return false;
    }

    return firstRoleIds.every((roleId, index) => {
      return roleId === secondRoleIds[index];
    });
  }

  function syncSelectedRoleIds(): void {
    selectedRoleIds.value = originalRoleIds.value;
  }

  watch([() => props.user.roles, () => props.roles], syncSelectedRoleIds, {
    immediate: true,
  });

  async function saveRoles(): Promise<void> {
    isSaving.value = true;

    try {
      const savedRoles = await $fetch<AdminRoleResponse[]>(
        `/api/auth/users/${props.user.id}/roles`,
        {
          body: {
            roleIds: sortedSelectedRoleIds.value,
          },
          method: 'PUT',
        },
      );

      emit('saved', {
        ...props.user,
        roles: savedRoles.map((role) => role.name),
      });

      toast.add({ title: ADMIN_USERS_SAVED_TOAST, color: 'success' });
    } catch (error) {
      if (error instanceof FetchError) {
        consola.error(error.data);
      } else {
        consola.error(error);
      }

      toast.add({ title: ADMIN_USERS_SAVE_ERROR_TOAST, color: 'error' });
    } finally {
      isSaving.value = false;
    }
  }
</script>

<template>
  <div class="space-y-6">
    <!-- Профиль: метаданные пользователя -->
    <div
      class="grid grid-cols-2 gap-x-6 gap-y-4 rounded-xl border border-default bg-default/10 p-4"
    >
      <!-- Email -->
      <div class="col-span-2 flex flex-col gap-1">
        <span class="text-xs font-medium tracking-wide text-muted uppercase">
          Email
        </span>

        <span
          class="cursor-pointer text-sm break-all text-highlighted transition-colors select-all hover:text-primary"
          title="Нажмите, чтобы скопировать email"
          @click.left.exact.prevent="() => copy(user.email)"
        >
          {{ user.email }}
        </span>
      </div>

      <!-- ID -->
      <div class="col-span-2 flex flex-col gap-1">
        <span class="text-xs font-medium tracking-wide text-muted uppercase">
          ID (UUID)
        </span>

        <span
          class="cursor-pointer font-mono text-sm break-all text-highlighted transition-colors select-all hover:text-primary"
          title="Нажмите, чтобы скопировать ID"
          @click.left.exact.prevent="() => copy(user.id)"
        >
          {{ user.id }}
        </span>
      </div>

      <!-- Регистрация -->
      <div class="col-span-1 flex flex-col gap-1">
        <span class="text-xs font-medium tracking-wide text-muted uppercase">
          Регистрация
        </span>

        <span class="text-sm text-highlighted">{{ createdAtLabel }}</span>
      </div>

      <!-- Обновлён -->
      <div class="col-span-1 flex flex-col gap-1">
        <span class="text-xs font-medium tracking-wide text-muted uppercase">
          Обновлён
        </span>

        <span class="text-sm text-highlighted">{{ updatedAtLabel }}</span>
      </div>

      <!-- Статусы аккаунта -->
      <div class="col-span-2 flex flex-col gap-1.5">
        <span class="text-xs font-medium tracking-wide text-muted uppercase">
          Состояние
        </span>

        <div class="flex flex-wrap gap-2">
          <UBadge
            v-if="user.enabled"
            color="success"
            variant="subtle"
            size="sm"
          >
            {{ ADMIN_USERS_ACTIVE_BADGE }}
          </UBadge>

          <UBadge
            v-if="user.accountLocked"
            color="error"
            variant="subtle"
            size="sm"
          >
            {{ ADMIN_USERS_LOCKED_BADGE }}
          </UBadge>

          <UBadge
            :color="user.emailVerified ? 'success' : 'warning'"
            variant="subtle"
            size="sm"
          >
            {{
              user.emailVerified
                ? ADMIN_USERS_EMAIL_VERIFIED_BADGE
                : ADMIN_USERS_EMAIL_NOT_VERIFIED_BADGE
            }}
          </UBadge>

          <UBadge
            v-if="user.credentialsExpired"
            color="warning"
            variant="subtle"
            size="sm"
          >
            {{ ADMIN_USERS_CREDENTIALS_EXPIRED_BADGE }}
          </UBadge>
        </div>
      </div>
    </div>

    <!-- Роли -->
    <div class="space-y-3">
      <div class="flex items-center gap-2">
        <UIcon
          name="tabler:shield-lock"
          class="size-5 text-primary"
          aria-hidden="true"
        />

        <span class="text-sm font-medium text-highlighted">
          {{ ADMIN_USERS_ROLES_SECTION_TITLE }}
        </span>
      </div>

      <div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <!-- Подпись совпадает с заголовком секции — прячем визуально, оставляем для a11y -->
        <UFormField
          :label="ADMIN_USERS_ROLE_FIELD_LABEL"
          :ui="{ label: 'sr-only' }"
        >
          <USelectMenu
            v-model="selectedRoleIds"
            :items="roleSelectItems"
            :placeholder="ADMIN_USERS_ROLE_PLACEHOLDER"
            label-key="label"
            value-key="value"
            multiple
            class="w-full"
          />
        </UFormField>

        <UButton
          icon="tabler:device-floppy"
          :loading="isSaving"
          :disabled="isSaveDisabled"
          @click.left.exact.prevent="saveRoles"
        >
          {{ ADMIN_USERS_SAVE_LABEL }}
        </UButton>
      </div>
    </div>

    <USeparator />

    <!-- Блокировка аккаунта и массовые операции с комментариями -->
    <AdminUserBan
      :user="user"
      @saved="onUserSaved"
      @comments-changed="refreshComments"
    />

    <USeparator />

    <!-- Подписка -->
    <AdminUserSubscription :username="user.username" />

    <USeparator />

    <!-- Активированные коды -->
    <AdminUserRedeemedCodes :username="user.username" />

    <USeparator />

    <!-- Комментарии: сервис комментариев ключуется по UUID, а не по логину -->
    <AdminUserComments
      :key="commentsListVersion"
      :author-id="user.id"
    />
  </div>
</template>
