export function useStatistics() {
  function updateStatisticVisibility(
    _key: string,
    _isPublic: boolean,
  ): Promise<boolean> {
    // TODO: Реализовать API запрос
    // await $fetch('/api/user/statistics', {
    //   method: 'PATCH',
    //   body: { key, isPublic },
    // });
    return Promise.resolve(true);
  }

  return { updateStatisticVisibility };
}
