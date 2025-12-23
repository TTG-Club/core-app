import { nextTick, watch } from 'vue';
import type { Ref } from 'vue';
import { idbGet, idbSet } from './idbKv';
import type { HistoryEntry } from '../types';

const KEY_HISTORY = 'dice-roller:history:v1';

function toPlainHistory(entries: HistoryEntry[]): HistoryEntry[] {
  return entries.map((e) => ({
    id: e.id,
    formula: e.formula,
    displayValue: e.displayValue,
    isError: e.isError,
    timestamp: e.timestamp,
    detail: e.detail ?? undefined,
  }));
}

export function useDiceRollerHistory(opts: {
  history: Ref<HistoryEntry[]>;
  historyScrollEl: Ref<HTMLElement | null>;
}) {
  const { history, historyScrollEl } = opts;

  const scrollToBottom = async () => {
    await nextTick();

    const el = historyScrollEl.value;

    if (!el) return;
    el.scrollTop = el.scrollHeight;
  };

  const load = async () => {
    try {
      const saved = await idbGet<HistoryEntry[]>(KEY_HISTORY);

      if (Array.isArray(saved)) {
        history.value = toPlainHistory(saved);
        await scrollToBottom();
      }
    } catch (e) {
      console.error('DiceRoller: failed to load history from IDB', e);
    }
  };

  let persistQueued = false;

  const persist = async () => {
    try {
      await idbSet(KEY_HISTORY, toPlainHistory(history.value));
    } catch (e) {
      console.error('DiceRoller: failed to save history to IDB', e);
    }
  };

  const queuePersist = () => {
    if (persistQueued) return;
    persistQueued = true;

    queueMicrotask(async () => {
      persistQueued = false;
      await persist();
    });
  };

  const clear = async () => {
    history.value = [];
    queuePersist();
    await scrollToBottom();
  };

  watch(
    () => history.value.length,
    async () => {
      queuePersist();
      await scrollToBottom();
    },
  );

  return {
    load,
    clear,
    scrollToBottom,
    persist,
  };
}
