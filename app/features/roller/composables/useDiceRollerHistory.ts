import { watch } from 'vue';

import { idbGet, idbSet } from './idbKv';

import type { Ref } from 'vue';

import type { HistoryEntry } from '../types';

const KEY_HISTORY = 'dice-roller:history:v1';

export function useDiceRollerHistory(opts: {
  history: Ref<HistoryEntry[]>;
  historyScrollEl: Ref<HTMLElement | null>;
  isOpen: Ref<boolean>;
}) {
  const { history, historyScrollEl, isOpen } = opts;

  const scrollToBottom = async () => {
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );

    const el = historyScrollEl.value;

    if (!el) {
      return;
    }

    el.scrollTop = el.scrollHeight;
  };

  const load = async () => {
    const saved = await idbGet<HistoryEntry[]>(KEY_HISTORY);

    if (Array.isArray(saved)) {
      history.value = saved;
    }
  };

  const persist = async () => {
    const payload = history.value.map((x) => ({ ...x }));

    await idbSet(KEY_HISTORY, payload);
  };

  const clear = async () => {
    history.value = [];
    await persist();
    await scrollToBottom();
  };

  watch(
    () => ({
      isOpen: isOpen.value,
      historyLength: history.value.length,
    }),
    async (state, prev) => {
      if (!state.isOpen) {
        return;
      }

      await scrollToBottom();

      if (state.historyLength !== prev.historyLength) {
        await persist();
      }
    },
    { flush: 'post' },
  );

  return {
    load,
    clear,
    scrollToBottom,
  };
}
