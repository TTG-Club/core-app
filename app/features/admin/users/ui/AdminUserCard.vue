<script setup lang="ts">
  import type {
    AdminRoleResponse,
    AdminRoleSelectItem,
    AdminUserResponse,
  } from '../model';

  import { FetchError } from 'ofetch';

  import {
    ADMIN_USERS_ACTIVE_BADGE,
    ADMIN_USERS_CREDENTIALS_EXPIRED_BADGE,
    ADMIN_USERS_EMAIL_NOT_VERIFIED_BADGE,
    ADMIN_USERS_EMAIL_VERIFIED_BADGE,
    ADMIN_USERS_LOCKED_BADGE,
    ADMIN_USERS_ROLE_FIELD_LABEL,
    ADMIN_USERS_ROLE_PLACEHOLDER,
    ADMIN_USERS_SAVE_ERROR_TOAST,
    ADMIN_USERS_SAVE_LABEL,
    ADMIN_USERS_SAVED_TOAST,
  } from '../model';

  const props = defineProps<{
    roles: AdminRoleResponse[];
    user: AdminUserResponse;
  }>();

  const emit = defineEmits<{
    saved: [user: AdminUserResponse];
  }>();

  const toast = useToast();
  const selectedRoleIds = ref<number[]>([]);
  const isSaving = ref(false);

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
  <UCard variant="subtle">
    <template #header>
      <div
        class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"
      >
        <div class="min-w-0">
          <h2 class="truncate text-base font-semibold text-highlighted">
            {{ user.username }}
          </h2>

          <p class="truncate text-sm text-muted">
            {{ user.email }}
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <UBadge
            v-if="user.enabled"
            color="success"
            variant="subtle"
          >
            {{ ADMIN_USERS_ACTIVE_BADGE }}
          </UBadge>

          <UBadge
            v-if="user.accountLocked"
            color="error"
            variant="subtle"
          >
            {{ ADMIN_USERS_LOCKED_BADGE }}
          </UBadge>

          <UBadge
            :color="user.emailVerified ? 'success' : 'warning'"
            variant="subtle"
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
          >
            {{ ADMIN_USERS_CREDENTIALS_EXPIRED_BADGE }}
          </UBadge>
        </div>
      </div>
    </template>

    <div class="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
      <UFormField :label="ADMIN_USERS_ROLE_FIELD_LABEL">
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
  </UCard>
</template>
