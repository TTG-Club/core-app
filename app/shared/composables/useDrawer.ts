export function useDrawer(key: string) {
  const openedUrl = useState<string | null>(key, () => null);

  const isOpened = computed(() => !!openedUrl.value);

  function open(url: MaybeRefOrGetter<string>) {
    openedUrl.value = toValue(url);
  }

  function close() {
    openedUrl.value = null;
  }

  return {
    url: readonly(openedUrl),
    isOpened,
    open,
    close,
  };
}
