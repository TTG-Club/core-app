<script setup lang="ts">
  import { useUserStore } from '~/shared/stores';
  import { AuthModal } from '~user/auth-modal';
  import { Breakpoint } from '~/composables/useBreakpoints';

  const userStore = useUserStore();
  const { isAdmin } = useUserRoles();
  const { greaterOrEqual } = useBreakpoints();

  const { isLoggedIn, isLoading, user } = storeToRefs(userStore);

  const isAuthOpened = ref(false);
  const isMenuOpened = ref(false);

  const side = computed(() =>
    greaterOrEqual(Breakpoint.MD).value ? 'right' : 'top',
  );

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

  // Клавиатурные комбинации
  watch(
    isAdmin,
    (admin) => {
      if (admin) {
        defineShortcuts({
          ['meta_shift_m']: () => {
            navigateTo({ name: 'workshop' });
          },
        });
      }
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
      <div class="flex flex-col">
        <!-- Заголовок с именем и аватаром -->
        <div class="flex min-h-20 items-center gap-3 p-4">
          <div class="flex min-w-0 flex-1 flex-col">
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
            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-(--color-primary-500) text-sm font-semibold text-(--ui-text-inverted)"
          >
            {{ userInitials }}
          </div>
        </div>

        <!-- Статистика -->
        <div class="-mt-2 px-4 pb-3">
          <USeparator class="mb-2">
            <span class="text-sm font-medium">Статистика</span>
          </USeparator>

          <div class="flex flex-col gap-1.5">
            <div class="flex items-center justify-between text-sm">
              <span>Скоро будет</span>

              <span class="text-sm font-semibold"> ∞ </span>
            </div>

            <div class="flex items-center justify-between text-sm">
              <span>Скоро будет</span>

              <span class="text-sm font-semibold"> ∞ </span>
            </div>
          </div>
        </div>

        <USeparator />

        <!-- Навигация -->
        <div class="flex flex-col py-1">
          <div class="p-1">
            <UButton
              variant="ghost"
              class="w-full justify-start px-2 py-2 text-default"
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
              class="w-full justify-between px-2 py-2 text-default"
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
        <div class="p-1">
          <UButton
            variant="ghost"
            color="error"
            class="w-full justify-start px-2 py-2"
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
