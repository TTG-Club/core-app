export function useGeneral() {
  const toast = useToast();
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  function updateDisplayName(_name: string): Promise<boolean> {
    isLoading.value = true;
    error.value = null;

    // TODO: Реализовать API запрос
    // await $fetch('/api/user/profile', { method: 'PATCH', body: { displayName: _name } });

    toast.add({
      title: 'Имя обновлено',
      description: 'Ваше отображаемое имя успешно изменено',
      color: 'success',
    });

    isLoading.value = false;

    return Promise.resolve(true);
  }

  return { updateDisplayName, isLoading, error };
}
