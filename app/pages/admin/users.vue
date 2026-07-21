<script setup lang="ts">
  import type {
    AdminDisplayNameMatch,
    AdminRoleResponse,
    AdminUserResponse,
    PageAdminUserResponse,
  } from '~admin/users/model';

  import {
    ADMIN_USERS_DEFAULT_PAGE_SIZE,
    ADMIN_USERS_DETAIL_EMPTY_ICON,
    ADMIN_USERS_DETAIL_EMPTY_TEXT,
    ADMIN_USERS_DETAIL_EMPTY_TITLE,
    ADMIN_USERS_EMPTY_TEXT,
    ADMIN_USERS_FOUND_LABEL,
    ADMIN_USERS_LOAD_ERROR_TEXT,
    ADMIN_USERS_NAME_SEARCH_API_PATH,
    ADMIN_USERS_NAME_SEARCH_MIN_LENGTH,
    ADMIN_USERS_PAGE_DESCRIPTION,
    ADMIN_USERS_PAGE_TITLE,
    ADMIN_USERS_ROLE_FILTER_ALL,
    ADMIN_USERS_ROLE_FILTER_ALL_LABEL,
    ADMIN_USERS_SEARCH_DEBOUNCE,
    ADMIN_USERS_SEARCH_PLACEHOLDER,
    ADMIN_USERS_TOTAL_LABEL,
  } from '~admin/users/model';
  import {
    AdminUserDetailPane,
    AdminUserNameMatches,
    AdminUserRow,
  } from '~admin/users/ui';

  useSeoMeta({
    title: ADMIN_USERS_PAGE_TITLE,
  });

  const { isSplitActive } = useLayoutWidth();
  const route = useRoute();
  const router = useRouter();
  const requestFetch = useRequestFetch();

  const search = shallowRef('');
  const searchQuery = refDebounced(search, ADMIN_USERS_SEARCH_DEBOUNCE);

  const currentPage = ref(1);
  const itemsPerPage = ADMIN_USERS_DEFAULT_PAGE_SIZE;

  // Фильтр по роли — серверный: auth-service фильтрует до пагинации,
  // поэтому content и totalElements согласованы с выбранной ролью.
  const roleFilter = ref<string>(ADMIN_USERS_ROLE_FILTER_ALL);

  const {
    data: usersPage,
    status: usersStatus,
    error: usersError,
    refresh: refreshUsers,
  } = await useAsyncData<PageAdminUserResponse>(
    'admin-users',
    () =>
      requestFetch('/api/auth/users', {
        query: {
          query: searchQuery.value || undefined,
          role:
            roleFilter.value === ADMIN_USERS_ROLE_FILTER_ALL
              ? undefined
              : roleFilter.value,
          page: currentPage.value - 1,
          size: itemsPerPage,
        },
      }),
    {
      watch: [currentPage, searchQuery, roleFilter],
    },
  );

  const { data: roles } = await useAsyncData<AdminRoleResponse[]>(
    'admin-roles',
    () => requestFetch('/api/auth/roles'),
    { default: () => [] },
  );

  // Поиск по отображаемому имени — отдельным запросом в core-api (имена живут там,
  // а auth-service ищет только по username/email). Best-effort: недоступность → [].
  const { data: nameMatchesData } = await useAsyncData<AdminDisplayNameMatch[]>(
    'admin-users-name-matches',
    () =>
      searchQuery.value.length >= ADMIN_USERS_NAME_SEARCH_MIN_LENGTH
        ? requestFetch(ADMIN_USERS_NAME_SEARCH_API_PATH, {
            query: { query: searchQuery.value },
          })
        : Promise.resolve([]),
    { watch: [searchQuery], default: () => [] },
  );

  const isUsersLoading = computed(() => usersStatus.value === 'pending');
  const hasUsersError = computed(() => !!usersError.value);
  const resolvedUsers = computed(() => usersPage.value?.content ?? []);
  const totalUsers = computed(() => usersPage.value?.totalElements ?? 0);

  // Подсказки по имени, которых нет в основной выдаче (там поиск по username/email).
  const nameMatches = computed<AdminDisplayNameMatch[]>(() => {
    const knownLogins = new Set(
      resolvedUsers.value.map((user) => user.username.toLowerCase()),
    );

    return (nameMatchesData.value ?? []).filter(
      (match) => !knownLogins.has(match.login.toLowerCase()),
    );
  });

  // Активен ли поиск/фильтр — от этого зависит подпись счётчика («Найдено» vs «Всего»).
  const isFiltered = computed(
    () =>
      !!searchQuery.value || roleFilter.value !== ADMIN_USERS_ROLE_FILTER_ALL,
  );

  const roleFilterOptions = computed(() => [
    {
      label: ADMIN_USERS_ROLE_FILTER_ALL_LABEL,
      value: ADMIN_USERS_ROLE_FILTER_ALL,
    },
    ...roles.value.map((role) => ({ label: role.name, value: role.name })),
  ]);

  // Выбранный пользователь синхронизирован с ?id (ищем в пределах текущей страницы).
  const selectedId = computed<string | null>(() => {
    const id = route.query.id;

    return typeof id === 'string' && id ? id : null;
  });

  const selectedUser = computed(
    () =>
      resolvedUsers.value.find((user) => user.id === selectedId.value) ?? null,
  );

  function selectUser(id: string): void {
    router.replace({ query: { ...route.query, id } });
  }

  // Клик по подсказке подставляет логин в поиск — основной список найдёт пользователя.
  function applyNameMatch(login: string): void {
    search.value = login;
  }

  function closePanel(): void {
    router.replace({ query: { ...route.query, id: undefined } });
  }

  // Смена поиска или фильтра сбрасывает на первую страницу и снимает выделение.
  watch([searchQuery, roleFilter], () => {
    currentPage.value = 1;

    if (selectedId.value) {
      closePanel();
    }
  });

  function onUserSaved(updated: AdminUserResponse): void {
    if (!usersPage.value) {
      return;
    }

    usersPage.value = {
      ...usersPage.value,
      content: usersPage.value.content.map((user) =>
        user.id === updated.id ? updated : user,
      ),
    };
  }

  // Дровер для стандартного режима (в split-режиме деталь живёт в #detail).
  const isPanelOpen = computed({
    get: () => !isSplitActive.value && !!selectedUser.value,
    set: (open: boolean) => {
      if (!open) {
        closePanel();
      }
    },
  });
</script>

<template>
  <div>
    <NuxtLayout
      name="section"
      :title="ADMIN_USERS_PAGE_TITLE"
    >
      <!-- Управление: поиск и фильтр по роли -->
      <template #controls>
        <div class="flex flex-col gap-3">
          <p class="text-xs leading-normal text-secondary">
            {{ ADMIN_USERS_PAGE_DESCRIPTION }}
          </p>

          <!-- Счётчик пользователей (всего / найдено по фильтру) -->
          <div
            class="flex flex-col rounded-lg border border-default bg-elevated/50 px-3 py-2.5"
          >
            <span
              class="text-[10px] font-medium tracking-wider text-muted uppercase"
            >
              {{
                isFiltered ? ADMIN_USERS_FOUND_LABEL : ADMIN_USERS_TOTAL_LABEL
              }}
            </span>

            <span
              class="text-lg leading-tight font-bold text-default tabular-nums"
            >
              {{ totalUsers }}
            </span>
          </div>

          <UInput
            v-model="search"
            icon="tabler:search"
            :placeholder="ADMIN_USERS_SEARCH_PLACEHOLDER"
            :loading="isUsersLoading"
            class="w-full"
            :ui="{ trailing: 'pe-0.5' }"
          >
            <template
              v-if="search"
              #trailing
            >
              <UButton
                icon="tabler:x"
                variant="link"
                color="neutral"
                size="sm"
                aria-label="Очистить поиск"
                @click.left.exact.prevent="search = ''"
              />
            </template>
          </UInput>

          <USelectMenu
            v-model="roleFilter"
            :items="roleFilterOptions"
            value-key="value"
            label-key="label"
            class="w-full"
          />
        </div>
      </template>

      <!-- Список пользователей -->
      <template #default>
        <div class="flex flex-col gap-3">
          <!-- Подсказки по отображаемому имени (поиск по имени в core-api) -->
          <AdminUserNameMatches
            v-if="nameMatches.length"
            :matches="nameMatches"
            @select="applyNameMatch"
          />

          <!-- Загрузка -->
          <div
            v-if="isUsersLoading"
            class="flex flex-col gap-2"
          >
            <USkeleton
              v-for="index in 6"
              :key="index"
              class="h-16 w-full rounded-xl"
            />
          </div>

          <!-- Ошибка загрузки -->
          <div
            v-else-if="hasUsersError"
            class="flex flex-col items-center gap-3 py-12 text-center"
          >
            <p class="text-sm text-error">{{ ADMIN_USERS_LOAD_ERROR_TEXT }}</p>

            <UButton
              icon="tabler:refresh"
              color="neutral"
              variant="soft"
              size="sm"
              @click.left.exact.prevent="() => refreshUsers()"
            >
              Повторить
            </UButton>
          </div>

          <!-- Строки -->
          <div
            v-else-if="resolvedUsers.length"
            class="flex flex-col gap-2"
          >
            <AdminUserRow
              v-for="user in resolvedUsers"
              :key="user.id"
              :user="user"
              :is-opened="selectedId === user.id"
              @select="selectUser"
            />

            <!-- Пагинация -->
            <div
              v-if="totalUsers > itemsPerPage"
              class="flex justify-center pt-4"
            >
              <UPagination
                v-model:page="currentPage"
                :total="totalUsers"
                :items-per-page="itemsPerPage"
                show-edges
                :sibling-count="1"
              />
            </div>
          </div>

          <!-- Пустое состояние (скрыто, если есть подсказки по имени) -->
          <div
            v-else-if="!nameMatches.length"
            class="py-12 text-center text-secondary"
          >
            {{ ADMIN_USERS_EMPTY_TEXT }}
          </div>
        </div>
      </template>

      <!-- Деталь (широкий режим) -->
      <template #detail>
        <AdminUserDetailPane
          v-if="selectedUser"
          :key="selectedUser.id"
          :user="selectedUser"
          :roles="roles"
          @close="closePanel"
          @saved="onUserSaved"
        />

        <div
          v-else
          class="flex h-full w-full flex-col items-center justify-center p-6 text-center select-none"
        >
          <div class="flex max-w-xs flex-col items-center gap-3">
            <UIcon
              :name="ADMIN_USERS_DETAIL_EMPTY_ICON"
              class="size-10 text-muted/40"
            />

            <h3 class="text-lg font-semibold text-highlighted">
              {{ ADMIN_USERS_DETAIL_EMPTY_TITLE }}
            </h3>

            <p class="text-sm text-secondary">
              {{ ADMIN_USERS_DETAIL_EMPTY_TEXT }}
            </p>
          </div>
        </div>
      </template>
    </NuxtLayout>

    <!-- Дровер (стандартный режим) -->
    <USlideover
      v-model:open="isPanelOpen"
      :close="false"
      :ui="{ content: 'w-full max-w-2xl' }"
    >
      <template #content>
        <AdminUserDetailPane
          v-if="selectedUser"
          :key="selectedUser.id"
          :user="selectedUser"
          :roles="roles"
          @close="closePanel"
          @saved="onUserSaved"
        />
      </template>
    </USlideover>
  </div>
</template>
