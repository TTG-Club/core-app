<script setup lang="ts">
  import { MY_BUGS_UPDATES_HINT } from '~bug-report/model';
  import { useMyBugReportUpdates } from '~bug-report/my';
  import { useCharacterSheetEditRequests } from '~character-sheet/composables';
  import {
    CHARACTER_SHEET_LIST_TITLE,
    CHARACTER_SHEET_ROUTE,
    SHEET_EDIT_REQUESTS_UPDATES_HINT,
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
  import {
    VTTG_MODULES_ICON,
    VTTG_MODULES_ROUTE,
    VTTG_MODULES_TITLE,
  } from '~vttg-modules/model';

  import UserInfo from './UserInfo.vue';

  /**
   * Меню авторизованного пользователя под шлемом.
   *
   * Монтируется только для вошедшего (см. UserHelmet), поэтому сводки изменений
   * заводятся в момент входа — и без перезагрузки страницы, — а при выходе
   * умирают вместе с меню и перестают опрашивать сервисы.
   */
  const { logout: userLogout, user, pending } = useUser();

  const { isAdmin, canEditEntities, canAccessModerationPanel } = useUserRoles();
  const { isTablet } = useBreakpoints();

  const isMenuOpened = ref(false);

  const side = computed(() => (isTablet.value ? 'right' : 'top'));

  // Прогреваем статус подписки/перки и картинку рамки заранее: контент поповера
  // (UserInfo) монтируется лениво при открытии, и без прогрева корона и рамка
  // «доезжали» уже в открытой панели.
  useProfileBadges();

  const bugReportUpdates = useMyBugReportUpdates();
  const commentUpdates = useMyCommentUpdates();

  // Уведомления игр читает и колокольчик раздела: композабл общий, поэтому
  // второго запроса от меню не будет.
  const gameNotifications = useFindGameNotifications();

  // Запросы на правки листов: ответить на них можно только в самом листе,
  // поэтому точка стоит у пункта листов, а не у профиля.
  const { hasRequests: hasSheetEditRequests } = useCharacterSheetEditRequests();

  const hasProfileUpdates = computed(
    () => bugReportUpdates.hasUpdates.value || commentUpdates.hasUpdates.value,
  );

  /** Новости в играх: заявка, решение мастера, изменение встречи. */
  const hasGameUpdates = computed(() => gameNotifications.unread.value > 0);

  /** Точка на шлеме одна на всё меню — зажечь её может любая новость. */
  const hasAnyUpdates = computed(
    () =>
      hasProfileUpdates.value
      || hasGameUpdates.value
      || hasSheetEditRequests.value,
  );

  // Подсказка называет всё, что ждёт в профиле: точка одна, а поводов может
  // быть два сразу.
  const profileUpdatesHint = computed(() =>
    [
      bugReportUpdates.hasUpdates.value ? MY_BUGS_UPDATES_HINT : '',
      commentUpdates.hasUpdates.value ? MY_COMMENTS_UPDATES_HINT : '',
    ]
      .filter(Boolean)
      .join(' · '),
  );

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

  function openMenu() {
    isMenuOpened.value = true;
  }

  function openProfile() {
    closeMenu();
    navigateTo({ name: 'user-profile' });
  }

  function openWorkshop() {
    closeMenu();
    navigateTo({ name: 'workshop' });
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
          icon="ttg:profile-helmet-filled"
          variant="ghost"
          color="neutral"
          size="xl"
          @click.left.exact.prevent.stop="openMenu"
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
              <span class="flex items-center gap-2">
                {{ CHARACTER_SHEET_LIST_TITLE }}

                <UpdatesDot
                  v-if="hasSheetEditRequests"
                  :title="SHEET_EDIT_REQUESTS_UPDATES_HINT"
                />
              </span>
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

            <!-- Заявки авторов модулей VTTG: подача и ответы модератора -->
            <UButton
              :icon="VTTG_MODULES_ICON"
              color="neutral"
              variant="ghost"
              class="w-full"
              size="lg"
              :to="VTTG_MODULES_ROUTE"
              @click.left.exact="closeMenu"
            >
              {{ VTTG_MODULES_TITLE }}
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
</template>
