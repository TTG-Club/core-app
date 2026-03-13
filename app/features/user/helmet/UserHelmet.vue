<script setup lang="ts">
  import { KbdShortcut } from '~ui/kbd-shortcut';
  import { AuthModal } from '~user/auth-modal';

  import { UserInfo } from './ui';

  const {
    fetch: fetchUser,
    logout: userLogout,
    user,
    pending,
    isLoggedIn,
  } = useUser();

  const { isAdmin } = useUserRoles();
  const { isTablet } = useBreakpoints();

  const isAuthOpened = ref(false);
  const isMenuOpened = ref(false);

  const side = computed(() => (isTablet.value ? 'right' : 'top'));

  const helmetIcon = computed(() =>
    isLoggedIn.value
      ? 'ttg:profile-helmet-filled'
      : 'ttg:profile-helmet-outline',
  );

  try {
    await fetchUser();
  } catch (err) {
    console.error(err);
  }

  function logout() {
    closeMenu();
    userLogout();
  }

  function closeMenu() {
    isMenuOpened.value = false;
  }

  function dismissMenu(newOpenState: boolean) {
    if (newOpenState) {
      return;
    }

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

  function handleHelmetClick() {
    if (!isLoggedIn.value) {
      isAuthOpened.value = true;
    } else {
      isMenuOpened.value = true;
    }
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
  <UPopover
    :open="isMenuOpened"
    :content="{ side }"
    :ui="{ content: 'w-80 p-0' }"
    @update:open="dismissMenu"
  >
    <template #default>
      <UButton
        :loading="pending"
        :icon="helmetIcon"
        variant="ghost"
        color="neutral"
        size="xl"
        @click.left.exact.prevent.stop="handleHelmetClick"
      />
    </template>

    <template
      v-if="user"
      #content
    >
      <div class="flex flex-col">
        <UserInfo :user />

        <USeparator />

        <div class="flex flex-col">
          <div class="p-1">
            <UButton
              color="neutral"
              variant="ghost"
              size="lg"
              class="w-full"
              icon="tabler:user-cog"
              @click.left.exact.prevent="openProfile"
            >
              Настройка профиля
            </UButton>

            <UButton
              v-if="isAdmin"
              icon="ttg:menu-filled-workshop"
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
              icon="tabler:settings-cog"
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
              icon="tabler:logout"
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

  <AuthModal
    v-if="!isLoggedIn"
    v-model="isAuthOpened"
  />
</template>
