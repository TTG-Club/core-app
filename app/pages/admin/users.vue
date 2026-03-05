<script setup lang="ts">
  definePageMeta({
    layout: 'detail',
  });

  type UserRole = string;

  interface UserAdminItem {
    createdAt: string;
    updatedAt: string;
    id: string;
    username: string;
    email: string;
    roles: Array<UserRole>;
  }

  interface RoleDto {
    id: number;
    name: string;
  }

  const toast = useToast();
  const searchQuery = ref<string>('');

  const { data: roles, status: rolesStatus } = await useAsyncData<
    Array<RoleDto>
  >('admin-user-roles', () => $fetch('/api/v2/roles'));

  const { data: users, status: usersStatus } = await useAsyncData<
    Array<UserAdminItem>
  >('admin-users', () => $fetch('/api/user'));

  const roleItems = computed(() =>
    (roles.value ?? []).map((r) => ({
      label: r.name,
      value: r.name,
    })),
  );

  const filteredUsers = computed(() => {
    const list = users.value ?? [];
    const needle = searchQuery.value.trim().toLowerCase();

    if (!needle) {
      return list;
    }

    return list.filter(
      (u) =>
        u.username.toLowerCase().includes(needle) ||
        u.email.toLowerCase().includes(needle),
    );
  });

  const isLoading = computed(
    () => rolesStatus.value === 'pending' || usersStatus.value === 'pending',
  );

  const rolesDraftById = ref<Record<string, Array<UserRole>>>({});
  const savingById = ref<Record<string, boolean>>({});

  watchEffect(() => {
    const list = users.value ?? [];
    const draft = { ...rolesDraftById.value };

    for (const user of list) {
      if (!draft[user.id]) {
        draft[user.id] = [...user.roles];
      }
    }

    rolesDraftById.value = draft;
  });

  function formatRoles(userRoles: Array<UserRole>): string {
    return userRoles.join(', ');
  }

  function rolesChanged(original: string[], next: string[]): boolean {
    if (original.length !== next.length) {
      return true;
    }

    return [...original].sort().join('|') !== [...next].sort().join('|');
  }

  async function saveUserRoles(user: UserAdminItem) {
    const nextRoles = rolesDraftById.value[user.id] ?? [];

    if (!rolesChanged(user.roles, nextRoles)) {
      return;
    }

    savingById.value[user.id] = true;

    try {
      await $fetch(`/api/user/${user.id}/roles`, {
        method: 'PATCH',
        // ✅ отправляем массив, без обёртки roles
        body: nextRoles,
      });

      if (users.value) {
        const idx = users.value.findIndex((u) => u.id === user.id);

        if (idx !== -1) {
          users.value[idx].roles = [...nextRoles];
        }
      }

      toast.add({
        title: 'Роли обновлены',
        description: `${user.username}: ${formatRoles(nextRoles)}`,
        color: 'green',
      });
    } catch {
      rolesDraftById.value[user.id] = [...user.roles];

      toast.add({
        title: 'Ошибка обновления ролей',
        color: 'red',
      });
    } finally {
      savingById.value[user.id] = false;
    }
  }
</script>

<template>
  <NuxtLayout
    name="detail"
    title="Пользователи"
  >
    <div class="flex flex-col gap-4">
      <UCard variant="subtle">
        <template #header>
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 class="text-base text-highlighted">
                Управление пользователями
              </h2>

              <div class="text-sm text-muted">
                Роли:
                <span class="font-medium text-primary">
                  {{ roles?.length ?? 0 }}
                </span>
                , Пользователи:
                <span class="font-medium text-primary">
                  {{ users?.length ?? 0 }}
                </span>
              </div>
            </div>
          </div>
        </template>

        <div class="mb-4">
          <input
            v-model="searchQuery"
            class="bg-surface ring-border h-10 w-full rounded-lg px-3 text-sm text-primary ring-1 focus:ring-2 focus:ring-primary focus:outline-none"
            placeholder="Поиск по логину или email..."
            autocomplete="off"
          />
        </div>

        <div class="ring-border overflow-hidden rounded-xl ring-1">
          <div
            class="bg-ui-elevated grid grid-cols-[1fr_1.6fr_2fr] px-3 py-2 text-xs font-semibold tracking-wide text-muted uppercase"
          >
            <div>Ник</div>

            <div>Email</div>

            <div>Роли</div>
          </div>

          <div
            v-if="isLoading"
            class="px-3 py-6 text-sm text-muted"
          >
            Загрузка…
          </div>

          <div
            v-else-if="filteredUsers.length === 0"
            class="px-3 py-6 text-sm text-muted"
          >
            Пользователи не найдены.
          </div>

          <div v-else>
            <div
              v-for="user in filteredUsers"
              :key="user.id"
              class="border-border grid grid-cols-[1fr_1.6fr_2fr] items-center gap-2 border-t px-3 py-3"
            >
              <div class="truncate text-sm font-medium text-secondary">
                {{ user.username }}
              </div>

              <div class="truncate text-sm text-primary">
                {{ user.email }}
              </div>

              <USelectMenu
                v-model="rolesDraftById[user.id]"
                multiple
                :items="roleItems"
                value-key="value"
                label-key="label"
                :disabled="savingById[user.id]"
                class="w-full"
                placeholder="Выберите роли"
                @update:model-value="() => saveUserRoles(user)"
              />
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </NuxtLayout>
</template>
