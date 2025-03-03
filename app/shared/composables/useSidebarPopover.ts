export function useSidebarPopover(): {
  activeKey: Readonly<Ref<string | undefined>>;
  isOpened: (key: string) => boolean;
  open: (customKey?: string) => void;
  close: (customKey?: string) => void;
  toggle: (customKey?: string) => void;
};

export function useSidebarPopover(key: string): {
  popoverKey: Readonly<Ref<string>>;
  activeKey: Readonly<Ref<string | undefined>>;
  isOpened: ComputedRef<boolean>;
  open: (customKey?: string) => void;
  close: (customKey?: string) => void;
  toggle: (customKey?: string) => void;
};

export function useSidebarPopover(key?: string) {
  const activeKey = useState<string | undefined>('active-popover-key');

  function isOpened(keyForCheck: string) {
    return activeKey.value === keyForCheck;
  }

  function open(customKey?: string) {
    if (!key || !customKey) {
      return;
    }

    activeKey.value = customKey || key;
  }

  function close(customKey?: string) {
    if (customKey && activeKey.value !== customKey) {
      return;
    }

    activeKey.value = undefined;
  }

  function toggle(customKey?: string) {
    const keyForCheck = customKey || key;

    if (!keyForCheck) {
      return close();
    }

    return isOpened(keyForCheck) ? close(keyForCheck) : open(keyForCheck);
  }

  if (key) {
    return {
      popoverKey: readonly(ref(key)),
      activeKey: readonly(activeKey),

      isOpened: computed(() => isOpened(key)),
      open,
      close,
      toggle,
    };
  }

  return {
    activeKey: readonly(activeKey),

    isOpened,
    open,
    close,
    toggle,
  };
}
