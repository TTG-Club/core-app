<script setup lang="ts">
  import { useUserStore } from '~/shared/stores';
  import { AuthModal } from '~user/auth-modal';

  import type { DropdownMenuItem } from '@nuxt/ui';

  const userStore = useUserStore();
  const { isAdmin } = useUserRoles();
  const { greaterOrEqual } = useBreakpoints();

  const { isLoggedIn, isLoading, user } = storeToRefs(userStore);

  const isAuthOpened = ref(false);
  const isMenuOpened = ref(false);
  const isMenuOnLeft = greaterOrEqual(Breakpoint.MD);

  const side = computed(() => (isMenuOnLeft.value ? 'right' : 'top'));

  try {
    await userStore.fetch();
  } catch (err) {
    console.error(err);
  }

  // Получаем инициалы из имени пользователя
  const userInitials = computed(() => {
    if (!user.value?.username) {
      return 'U';
    }

    const parts = user.value.username.split(' ');

    if (parts.length >= 2) {
      const first = parts[0]?.[0];
      const second = parts[1]?.[0];

      if (first && second) {
        return (first + second).toUpperCase();
      }
    }

    const username = user.value.username;

    if (username && username.length >= 2) {
      return username.substring(0, 2).toUpperCase();
    }

    return 'U';
  });

  // Статистика пользователя (пока заглушки, можно подключить API позже)
  const userStats = ref({
    ratings: 234,
    errorsFound: 56,
    articles: 73,
    spells: 12,
    bestiary: 31,
    etc: 0,
  });

  function onClick() {
    isAuthOpened.value = true;
  }

  function logout() {
    userStore.logout().finally(() => {
      window.location.reload();
    });
  }

  function navigateToWorkshop() {
    isMenuOpened.value = false;
    navigateTo({ name: 'workshop' });
  }

  function navigateToProfile() {
    isMenuOpened.value = false;
    navigateTo({ name: 'user-profile' });
  }

  const items = computed<DropdownMenuItem[][]>(() => [
    [
      ...(isAdmin.value
        ? [
            {
              label: 'Мастерская',
              kbds: ['meta', 'shift', 'm'],
              onSelect: () => {
                navigateTo({ name: 'workshop' });
              },
            },
          ]
        : []),
      {
        label: 'Личный кабинет',
        to: {
          name: 'user-profile',
        },
      },
      {
        label: 'Сменить пароль',
        disabled: true,
      },
    ],
    [
      {
        label: 'Выйти',
        icon: 'i-ttg-logout',
        color: 'error',
        onSelect: logout,
      },
    ],
  ]);

  // Функция для извлечения клавиатурных комбинаций из items
  function extractShortcuts(
    menuItems: DropdownMenuItem[][],
  ): Record<string, () => void> {
    const shortcuts: Record<string, () => void> = {};

    for (const group of menuItems) {
      for (const item of group) {
        if (item.kbds && item.onSelect) {
          const key = item.kbds.join('_');

          shortcuts[key] = item.onSelect as () => void;
        }
      }
    }

    return shortcuts;
  }

  watch(
    items,
    (newItems) => {
      const shortcuts = extractShortcuts(newItems);

      defineShortcuts(shortcuts);
    },
    { immediate: true },
  );
</script>

<template>
  <template v-if="!isLoggedIn">
    <UButton
      :loading="isLoading"
      variant="ghost"
      icon="i-ttg-profile-helmet-outline"
      size="xl"
      color="neutral"
      @click.left.exact.prevent="onClick"
    />

    <AuthModal v-model="isAuthOpened" />
  </template>

  <UPopover
    v-else
    v-model:open="isMenuOpened"
    :content="{ side }"
    :ui="{ content: 'w-80 p-0' }"
  >
    <template #default>
      <UButton
        :loading="isLoading"
        variant="ghost"
        icon="i-ttg-profile-helmet-filled"
        size="xl"
        color="neutral"
      />
    </template>

    <template #content>
      <div
        :class="$style.dropdown"
        class="flex flex-col"
      >
        <!-- Заголовок с именем и аватаром -->
        <div
          :class="$style.header"
          class="flex items-center gap-3 p-4"
        >
          <div
            :class="$style.userInfo"
            class="flex min-w-0 flex-1 flex-col"
          >
            <div
              class="mb-1 overflow-hidden text-2xl font-semibold text-ellipsis whitespace-nowrap"
            >
              {{ user?.username || 'Пользователь' }}
            </div>

            <div
              class="overflow-hidden text-xs text-ellipsis whitespace-nowrap text-secondary"
            >
              {{ user?.email || '' }}
            </div>
          </div>

          <div
            :class="$style.avatar"
            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
          >
            {{ userInitials }}
          </div>
        </div>

        <!-- Статистика -->
        <div
          :class="$style.stats"
          class="-mt-2 px-4 pb-3"
        >
          <USeparator class="mb-2">
            <span class="text-sm font-medium">Статистика</span>
          </USeparator>

          <div
            :class="$style.statsList"
            class="flex flex-col gap-1.5"
          >
            <div
              :class="$style.statItem"
              class="flex items-center justify-between"
            >
              <span class="text-sm">Оценок</span>

              <span
                :class="$style.statValue"
                class="text-sm font-semibold"
              >
                {{ userStats.ratings }}
              </span>
            </div>

            <div
              :class="$style.statItem"
              class="flex items-center justify-between"
            >
              <span class="text-sm">Скоро будет</span>

              <span
                :class="$style.statValue"
                class="text-sm font-semibold"
              >
                ∞
              </span>
            </div>

            <div
              :class="$style.statItem"
              class="flex items-center justify-between"
            >
              <span class="text-sm">Скоро будет</span>

              <span
                :class="$style.statValue"
                class="text-sm font-semibold"
              >
                ∞
              </span>
            </div>
          </div>
        </div>

        <USeparator />

        <!-- Навигация -->
        <div
          :class="$style.navigation"
          class="flex flex-col"
        >
          <div class="p-1">
            <UButton
              variant="ghost"
              class="w-full justify-start px-4 py-2 text-default"
              @click="navigateToProfile"
            >
              <div class="flex items-center">
                <UIcon
                  name="i-ttg-settings"
                  class="mr-2 size-5"
                />

                <span>Настройка профиля</span>
              </div>
            </UButton>
          </div>

          <div
            v-if="isAdmin"
            class="p-1"
          >
            <UButton
              variant="ghost"
              class="w-full justify-between px-4 py-2 text-default"
              @click="navigateToWorkshop"
            >
              <div class="flex items-center">
                <UIcon
                  name="i-ttg-menu-filled-workshop"
                  class="mr-2 size-5"
                />

                <span>Мастерская</span>
              </div>

              <div class="flex items-center gap-1">
                <UKbd
                  size="sm"
                  variant="outline"
                >
                  Ctrl
                </UKbd>

                <UKbd
                  size="sm"
                  variant="outline"
                >
                  Shift
                </UKbd>

                <UKbd
                  size="sm"
                  variant="outline"
                >
                  M
                </UKbd>
              </div>
            </UButton>
          </div>
        </div>

        <USeparator />

        <!-- Выход -->
        <div
          :class="$style.logout"
          class="p-1"
        >
          <UButton
            variant="ghost"
            color="error"
            class="w-full justify-start px-4 py-2"
            @click="logout"
          >
            <div class="flex items-center">
              <UIcon
                name="i-ttg-logout"
                class="mr-2 size-5"
              />

              <span>Выход</span>
            </div>
          </UButton>
        </div>
      </div>
    </template>
  </UPopover>
</template>

<style lang="scss" module>
  .dropdown {
    min-width: 320px;
  }

  .header {
    min-height: 80px;
  }

  .avatar {
    flex-shrink: 0;
    color: var(--ui-text-inverted);
    background-color: var(--color-primary-500);
  }

  .userInfo {
    flex: 1 1 auto;
    min-width: 0;
  }

  .statsList {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .statItem {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 14px;
  }

  .statValue {
    font-size: 14px;
    font-weight: 600;
  }

  .navigation {
    display: flex;
    flex-direction: column;
    padding: 4px 0;
  }

  .logout {
    padding: 4px;
  }
</style>
