export function useDrawer(key: string) {
  const route = useRoute();

  const openedUrl = useState<string | null>(key, () => null);

  const isOpened = computed(() => !!openedUrl.value);

  function open(url: MaybeRefOrGetter<string>) {
    openedUrl.value = toValue(url);
  }

  function close() {
    openedUrl.value = null;
  }

  watch(() => route.fullPath, close);

  return {
    url: readonly(openedUrl),
    isOpened,
    open,
    close,
  };
}
