<script setup lang="ts">
  import { useUserStore } from '~/shared/stores';
  import { AuthModal } from '~user/auth-modal';
  import { KbdShortcut } from '~ui/kbd-shortcut';

  const userStore = useUserStore();
  const { isAdmin } = useUserRoles();
  const { isTablet } = useBreakpoints();

  const { isLoggedIn, isLoading, user } = storeToRefs(userStore);

  const isAuthOpened = ref(false);
  const isMenuOpened = ref(false);

  const side = computed(() => (isTablet.value ? 'right' : 'top'));

  try {
    await userStore.fetch();
  } catch (err) {
    console.error(err);
  }

  const userInitials = computed(() => {
    if (!user.value?.username) return 'U';

    const parts = user.value.username.split(' ');

    if (parts.length >= 2) {
      const first = parts[0]?.[0];
      const second = parts[1]?.[0];

      if (first && second) return (first + second).toUpperCase();
    }

    const username = user.value.username;

    return username && username.length >= 2
      ? username.substring(0, 2).toUpperCase()
      : 'U';
  });

  function onClick() {
    isAuthOpened.value = true;
  }

  function logout() {
    userStore.logout().finally(() => {
      window.location.reload();
    });
  }

  function closeMenu() {
    isMenuOpened.value = false;
  }

  function openProfile() {
    closeMenu();
    navigateTo({ name: 'user-profile' });
  }

  function openWorkshop() {
    closeMenu();
    navigateTo({ name: 'workshop' });
  }

  if (isAdmin.value) {
    defineShortcuts({
      // eslint-disable-next-line camelcase
      meta_shift_m: openWorkshop,
    });
  }
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
        v-if="user"
        class="flex flex-col"
      >
        <div class="flex min-h-20 items-center gap-3 p-4">
          <div class="flex min-w-0 flex-1 flex-col">
            <div
              class="mb-1 overflow-hidden text-2xl font-semibold text-ellipsis whitespace-nowrap"
            >
              {{ user.username }}
            </div>

            <div
              class="overflow-hidden text-xs text-ellipsis whitespace-nowrap text-secondary"
            >
              {{ user.email }}
            </div>
          </div>

          <div
            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-(--color-primary-500) text-sm font-semibold text-(--ui-text-inverted)"
          >
            {{ userInitials }}
          </div>
        </div>

        <div class="-mt-2 px-4 pb-3">
          <USeparator class="mb-2">
            <span class="text-sm font-medium">Статистика</span>
          </USeparator>

          <div class="flex flex-col gap-1.5">
            <div class="flex items-center justify-between text-sm">
              <span>Скоро будет</span>

              <span class="text-sm font-semibold">∞</span>
            </div>

            <div class="flex items-center justify-between text-sm">
              <span>Скоро будет</span>

              <span class="text-sm font-semibold">∞</span>
            </div>
          </div>
        </div>

        <USeparator />

        <div class="flex flex-col py-1">
          <div class="p-1">
            <UButton
              variant="ghost"
              class="w-full justify-between px-2 py-2 text-default"
              @click="openProfile"
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
              @click="openWorkshop"
            >
              <div class="flex items-center">
                <UIcon
                  name="i-ttg-menu-filled-workshop"
                  class="mr-2 size-5"
                />

                <span>Мастерская</span>
              </div>

              <KbdShortcut :kbds="['meta', 'shift', 'm']" />
            </UButton>
          </div>

          <USeparator />

          <div class="p-1">
            <UButton
              variant="ghost"
              color="error"
              class="w-full justify-between px-2 py-2 text-default"
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
      </div>
    </template>
  </UPopover>
</template>
