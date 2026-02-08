<script setup lang="ts">
  import { KbdShortcut } from '~ui/kbd-shortcut';
  import { AuthModal } from '~user/auth-modal';

  import { useUserStore } from '~/shared/stores';

  import type { UserProfileDetailed } from '~/shared/types';

  const userStore = useUserStore();
  const { isAdmin } = useUserRoles();
  const { isTablet } = useBreakpoints();

  const { isLoading, user } = storeToRefs(userStore);

  const isAuthOpened = ref(false);
  const isMenuOpened = ref(false);

  const side = computed(() => (isTablet.value ? 'right' : 'top'));

  const STATUS_PENDING = 'pending';

  try {
    await userStore.fetch();
  } catch (err) {
    console.error(err);
  }

  const {
    data: detailedProfile,
    status: detailedProfileStatus,
    execute: fetchDetailedProfile,
  } = await useAsyncData(
    'user-profile-detailed',
    () =>
      $fetch<{ statistics?: { ratingCount: number } }>(
        '/api/user/profile/detailed',
      ),
    {
      dedupe: 'defer',
      lazy: true,
      server: false,
      immediate: false,
    },
  );

  watch(
    user,
    (newUser) => {
      if (newUser && detailedProfileStatus.value === 'idle') {
        fetchDetailedProfile();
      }
    },
    { immediate: true },
  );

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
    defineShortcuts(
      {
        // eslint-disable-next-line camelcase
        meta_shift_m: openWorkshop,
      },
      {
        layoutIndependent: true,
      },
    );
  }
</script>

<template>
  <template v-if="!user">
    <UButton
      :loading="isLoading"
      variant="ghost"
      icon="i-ttg-profile-helmet-outline"
      size="xl"
      color="neutral"
      @click.left.exact.prevent="isAuthOpened = true"
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

          <UAvatar
            :alt="user.username"
            size="3xl"
            :ui="{ fallback: 'uppercase' }"
          />
        </div>

        <div class="-mt-2 px-4 pb-3">
          <USeparator class="mb-2">
            <span class="text-sm font-medium">Статистика</span>
          </USeparator>

          <div class="flex flex-col gap-1.5">
            <div class="flex items-center justify-between text-sm">
              <span>Всего оценок</span>

              <span
                v-if="isLoading || detailedProfileStatus === STATUS_PENDING"
                class="text-sm font-semibold"
              >
                ...
              </span>

              <span
                v-else
                class="text-sm font-semibold"
              >
                {{ detailedProfile?.statistics?.ratingCount ?? 0 }}
              </span>
            </div>
          </div>
        </div>

        <USeparator />

        <div class="flex flex-col">
          <div class="p-1">
            <UButton
              color="neutral"
              variant="ghost"
              size="lg"
              class="w-full"
              icon="i-ttg-settings"
              @click.left.exact.prevent="openProfile"
            >
              Настройка профиля
            </UButton>

            <UButton
              v-if="isAdmin"
              icon="i-ttg-menu-filled-workshop"
              color="neutral"
              variant="ghost"
              class="w-full"
              size="lg"
              @click.left.exact.prevent="openWorkshop"
            >
              <div class="flex w-full items-center justify-between">
                <span>Мастерская</span>

                <KbdShortcut :kbds="['meta', 'shift', 'm']" />
              </div>
            </UButton>

            <UButton
              v-if="isAdmin"
              icon="i-fluent-settings-cog-multiple-24-regular"
              color="neutral"
              variant="ghost"
              class="w-full"
              size="lg"
              to="/admin"
              @click.left.exact="closeMenu"
            >
              <div class="flex w-full items-center justify-between">
                <span>Панель администратора</span>
              </div>
            </UButton>
          </div>

          <USeparator />

          <div class="p-1">
            <UButton
              class="w-full"
              icon="i-ttg-logout"
              variant="ghost"
              color="error"
              size="lg"
              @click.left.exact.prevent="logout"
            >
              Выход
            </UButton>
          </div>
        </div>
      </div>
    </template>
  </UPopover>
</template>
