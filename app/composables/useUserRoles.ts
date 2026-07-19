import { Role } from '~/shared/types';

export function useUserRoles() {
  const { user, roles } = useUser();

  const isWriter = computed(() => !!user.value?.roles.includes(Role.WRITER));

  const isModerator = computed(
    () => !!user.value?.roles.includes(Role.MODERATOR),
  );

  const isAdmin = computed(() => !!user.value?.roles.includes(Role.ADMIN));

  const canEditEntities = computed(() => isAdmin.value || isModerator.value);

  const canManageBugReports = computed(
    () => isAdmin.value || isModerator.value,
  );

  /** Модерация комментариев: правка и удаление чужих, лента жалоб. */
  const canModerateComments = computed(
    () => isAdmin.value || isModerator.value,
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
    canManageBugReports,
    canModerateComments,
    canAccessModerationPanel,
  };
}
