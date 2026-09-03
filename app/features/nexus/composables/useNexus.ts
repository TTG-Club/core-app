import type { MaybeRefOrGetter } from 'vue';

import { fetchNexus, fetchNexusMembers, removeNexusMember } from '../model';

/**
 * Одна комната вместе с составом.
 *
 * Состав приходит отдельным запросом: у комнаты игры он собирается из заявок
 * и меняется чаще самой комнаты.
 *
 * @param nexusId Комната; `null` — не запрашивать.
 */
export function useNexus(nexusId: MaybeRefOrGetter<string | null>) {
  const currentId = computed(() => toValue(nexusId));

  const {
    data: nexus,
    error,
    status,
    refresh: refreshNexus,
  } = useAsyncData(
    () => `nexus-${currentId.value ?? 'none'}`,
    async () => {
      const id = currentId.value;

      return id ? await fetchNexus(id) : null;
    },
    { watch: [currentId], deep: false, server: false },
  );

  const {
    data: members,
    status: membersStatus,
    refresh: refreshMembers,
  } = useAsyncData(
    () => `nexus-members-${currentId.value ?? 'none'}`,
    async () => {
      const id = currentId.value;

      return id ? await fetchNexusMembers(id) : [];
    },
    { watch: [currentId], deep: false, server: false, default: () => [] },
  );

  const isLoading = computed(
    () => status.value !== 'success' && status.value !== 'error',
  );

  const areMembersLoading = computed(
    () => membersStatus.value !== 'success' && membersStatus.value !== 'error',
  );

  /**
   * Выводит участника: себя или, если это владелец, кого угодно.
   * @param memberId Кого выводят.
   */
  async function removeMember(memberId: string): Promise<void> {
    const id = currentId.value;

    if (!id) {
      return;
    }

    await removeNexusMember(id, memberId);

    await Promise.all([refreshNexus(), refreshMembers()]);
  }

  return {
    nexus,
    members,

    error,
    status,
    isLoading,
    areMembersLoading,

    refreshNexus,
    refreshMembers,
    removeMember,
  };
}
