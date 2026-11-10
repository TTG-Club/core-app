import { Role } from '~/shared/types';
// Прямо из constants, а не из barrel `model`: useUserRoles есть на каждой
// странице, и тянуть за ним разметку (markdown.ts) в общий бандл незачем.
import { COMMUNITY_NEWS_EDITOR_ROLES } from '~community-news/model/constants';

export function useUserRoles() {
  const { user, roles } = useUser();

  const isWriter = computed(() => !!user.value?.roles.includes(Role.WRITER));

  const isModerator = computed(
    () => !!user.value?.roles.includes(Role.MODERATOR),
  );

  const isAdmin = computed(() => !!user.value?.roles.includes(Role.ADMIN));

  const canEditEntities = computed(() => isAdmin.value || isModerator.value);

  /** Правка источников: в core-api она закрыта для всех, кроме ADMIN. */
  const canEditSources = computed(() => isAdmin.value);

  const canManageBugReports = computed(
    () => isAdmin.value || isModerator.value,
  );

  /** Модерация комментариев: правка и удаление чужих, лента жалоб. */
  const canModerateComments = computed(
    () => isAdmin.value || isModerator.value,
  );

  /**
   * Публикация новостей сообщества — отдельный инструмент со своим правом:
   * роли берутся из `COMMUNITY_NEWS_EDITOR_ROLES`, чтобы потом выдать его
   * отдельной роли, не трогая права на остальной контент.
   */
  const canPublishCommunityNews = computed(() =>
    COMMUNITY_NEWS_EDITOR_ROLES.some(
      (role) => !!user.value?.roles.includes(role),
    ),
  );

  /** Доступ к панели модератора: открыт хотя бы один её раздел. */
  const canAccessModerationPanel = computed(
    () => canManageBugReports.value || canModerateComments.value,
  );

  return {
    roles,

    isWriter,
    isModerator,
    isAdmin,
    canEditEntities,
    canEditSources,
    canManageBugReports,
    canModerateComments,
    canPublishCommunityNews,
    canAccessModerationPanel,
  };
}
