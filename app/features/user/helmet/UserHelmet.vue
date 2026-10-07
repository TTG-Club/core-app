<script setup lang="ts">
  import { USER_TOKEN_COOKIE } from '#shared/consts';
  import { MY_BUGS_UPDATES_HINT } from '~bug-report/model';
  import { useMyBugReportUpdates } from '~bug-report/my';
  import {
    CHARACTER_SHEET_LIST_TITLE,
    CHARACTER_SHEET_ROUTE,
  } from '~character-sheet/model';
  import { MY_COMMENTS_UPDATES_HINT } from '~comments/model';
  import { useMyCommentUpdates } from '~comments/my';
  import { useFindGameNotifications } from '~find-game/composables';
  import {
    GAMES_MY_NAVIGATION_LABEL,
    GAMES_MY_ROUTE,
    MY_GAMES_UPDATES_HINT,
  } from '~find-game/model';
  import {
    MODERATION_PANEL_ICON,
    MODERATION_PANEL_TITLE,
    MODERATION_ROUTE,
  } from '~moderation/model';
  import { useProfileBadges } from '~profile/activation/composables';
  import { KbdShortcut } from '~ui/kbd-shortcut';
  import { UpdatesDot } from '~ui/updates-dot';
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

  // Сводки изменений (баг-репорты, ответы на комментарии) спрашиваем только у
  // авторизованных: у гостя ни своих репортов, ни своих комментариев нет,
  // а запросы уходили бы в 401 на каждой странице сайта.
  // Вызов до await — по той же причине, что и useProfileBadges ниже.
  const bugReportUpdates = userTokenCookie.value
    ? useMyBugReportUpdates()
    : null;

  const commentUpdates = userTokenCookie.value ? useMyCommentUpdates() : null;

  // Уведомления игр читает и колокольчик раздела: композабл общий, поэтому
  // второго запроса от меню не будет.
  const gameNotifications = userTokenCookie.value
    ? useFindGameNotifications()
    : null;

  const hasBugReportUpdates = computed(
    () => bugReportUpdates?.hasUpdates.value ?? false,
  );

  const hasCommentUpdates = computed(
    () => commentUpdates?.hasUpdates.value ?? false,
  );

  const hasProfileUpdates = computed(
    () => hasBugReportUpdates.value || hasCommentUpdates.value,
  );

  /** Новости в играх: заявка, решение мастера, изменение встречи. */
  const hasGameUpdates = computed(
    () => (gameNotifications?.unread.value ?? 0) > 0,
  );

  /** Точка на шлеме одна на всё меню — зажечь её может любая новость. */
  const hasAnyUpdates = computed(
    () => hasProfileUpdates.value || hasGameUpdates.value,
  );

  // Подсказка называет всё, что ждёт в профиле: точка одна, а поводов может
  // быть два сразу.
  const profileUpdatesHint = computed(() =>
    [
      hasBugReportUpdates.value ? MY_BUGS_UPDATES_HINT : '',
      hasCommentUpdates.value ? MY_COMMENTS_UPDATES_HINT : '',
    ]
      .filter(Boolean)
      .join(' · '),
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
      <!-- Точка на шлеме — единственный намёк снаружи профиля, что там ждут
        ответ команды или ответ на комментарий: иначе о них узнают случайно -->
      <UChip
        :show="hasAnyUpdates"
        color="primary"
        size="md"
      >
        <UButton
          :loading="pending"
          :icon="helmetIcon"
          variant="ghost"
          color="neutral"
          size="xl"
          @click.left.exact.prevent.stop="handleHelmetClick"
        />
      </UChip>
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
              <span class="flex items-center gap-2">
                Профиль

                <UpdatesDot
                  v-if="hasProfileUpdates"
                  :title="profileUpdatesHint"
                />
              </span>
            </UButton>

            <!-- Короткий путь к своим листам: раздел лежит в «Инструментах»
              бокового меню, а из шапки до него было не добраться -->
            <UButton
              icon="tabler:id"
              color="neutral"
              variant="ghost"
              class="w-full"
              size="lg"
              :to="CHARACTER_SHEET_ROUTE"
              @click.left.exact="closeMenu"
            >
              {{ CHARACTER_SHEET_LIST_TITLE }}
            </UButton>

            <!-- Короткий путь к своим играм: новости по ним ждут именно
              здесь, а из шапки до раздела было не добраться -->
            <UButton
              icon="tabler:dice"
              color="neutral"
              variant="ghost"
              class="w-full"
              size="lg"
              :to="GAMES_MY_ROUTE"
              @click.left.exact="closeMenu"
            >
              <span class="flex items-center gap-2">
                {{ GAMES_MY_NAVIGATION_LABEL }}

                <UpdatesDot
                  v-if="hasGameUpdates"
                  :title="MY_GAMES_UPDATES_HINT"
                />
              </span>
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
