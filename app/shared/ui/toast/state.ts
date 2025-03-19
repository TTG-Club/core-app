import type { ToastProps } from '~ui/toast/types';

const state = ref<Map<string, ToastProps>>(new Map());

export function useToastState() {
  const toasts = computed(() => Array.from(state.value.values()));

  return { state, toasts };
}
