<script setup lang="ts">
  import { USER_TOKEN_COOKIE } from '#shared/consts';
  import {
    MODERATION_PANEL_ICON,
    MODERATION_PANEL_TITLE,
    MODERATION_ROUTE,
  } from '~moderation/model';
  import { useProfileBadges } from '~profile/activation/composables';
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

  const { isAdmin, canEditEntities, canAccessModerationPanel } = useUserRoles();
  const { isTablet } = useBreakpoints();
  const userTokenCookie = useCookie<string | null>(USER_TOKEN_COOKIE);

  const isAuthOpened = ref(false);
  const isMenuOpened = ref(false);

  const side = computed(() => (isTablet.value ? 'right' : 'top'));

  const helmetIcon = computed(() =>
    isLoggedIn.value
      ? 'ttg:profile-helmet-filled'
      : 'ttg:profile-helmet-outline',
  );

  if (userTokenCookie.value) {
    // Прогреваем статус подписки/перки и картинку рамки заранее: контент поповера
    // (UserInfo) монтируется лениво при открытии, и без прогрева корона и рамка
    // «доезжали» уже в открытой панели. Вызов до await — чтобы остаться в
    // синхронном setup-контексте (useAsyncData/watch завязаны на инстанс).
    useProfileBadges();

    try {
      await fetchUser();
    } catch (err) {
      consola.error(err);
    }
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

  if (canEditEntities.value) {
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
        <UserInfo
          :user
          @open-profile="openProfile"
        />

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
              Профиль
            </UButton>

            <UButton
              v-if="canEditEntities"
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

            <UButton
              v-if="canAccessModerationPanel"
              :icon="MODERATION_PANEL_ICON"
              color="neutral"
              variant="ghost"
              class="w-full"
              size="lg"
              :to="MODERATION_ROUTE"
              @click.left.exact="closeMenu"
            >
              <div class="flex w-full items-center justify-between">
                <span>{{ MODERATION_PANEL_TITLE }}</span>
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
