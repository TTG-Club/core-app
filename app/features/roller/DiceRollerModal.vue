<script setup lang="ts">
  import {
    computed,
    ref,
    nextTick,
    onMounted,
    onBeforeUnmount,
    watch,
  } from 'vue';
  import { useDiceRoller } from '~/composables/useDiceRoller';
  import DiceD20IconUrl from '~/assets/icons/dice/d20.svg';

  type CriticalType = 'success' | 'failure' | null;

  interface DiceRollItem {
    id: string;
    value: number;
    valid: boolean;
    critical: CriticalType;
  }

  interface DiceDetail {
    id: string;
    label: string;
    total: number;
    rolls: DiceRollItem[];
  }

  interface HistoryEntry {
    id: string;
    formula: string;
    displayValue: string;
    isError: boolean;
    timestamp: string;
    detail?: string;
  }

  const IDB_DB_NAME = 'core-app';
  const IDB_STORE = 'kv';
  const IDB_KEY_HISTORY = 'dice-roller:history:v1';

  let kvDbPromise: Promise<IDBDatabase> | null = null;

  function openKvDb(): Promise<IDBDatabase> {
    if (kvDbPromise) return kvDbPromise;

    kvDbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(IDB_DB_NAME, 1);

      req.onupgradeneeded = () => {
        const db = req.result;

        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };

      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    return kvDbPromise;
  }

  async function idbGet<T>(key: string): Promise<T | undefined> {
    const db = await openKvDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);

      let out: T | undefined;

      const req = store.get(key);

      req.onsuccess = () => {
        out = req.result as T | undefined;
      };

      req.onerror = () => reject(req.error);

      tx.oncomplete = () => resolve(out);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  async function idbSet<T>(key: string, value: T): Promise<void> {
    const db = await openKvDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);

      store.put(value as any, key);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  function cloneHistoryEntries(entries: HistoryEntry[]): HistoryEntry[] {
    return entries.map((entry) => ({ ...entry }));
  }

  const rollFormula = ref<string>('');
  const result = ref<string | number | null>('');
  const history = ref<HistoryEntry[]>([]);
  const isCollapsed = ref<boolean>(true);
  const lastRollDetails = ref<DiceDetail[]>([]);
  const resultRenderKey = ref<number>(0);

  const historyScrollEl = ref<HTMLElement | null>(null);

  const scrollHistoryToBottom = async () => {
    await nextTick();

    const el = historyScrollEl.value;

    if (!el) return;
    el.scrollTop = el.scrollHeight;
  };

  onMounted(async () => {
    try {
      const saved = await idbGet<HistoryEntry[]>(IDB_KEY_HISTORY);

      if (Array.isArray(saved) && saved.length) {
        history.value = cloneHistoryEntries(saved);
      }

      await scrollHistoryToBottom();
    } catch (e) {
      console.error('DiceRoller: failed to load history from IDB', e);
    }
  });

  let saveTimer: ReturnType<typeof setTimeout> | undefined;

  const schedulePersistHistory = () => {
    if (saveTimer) {
      clearTimeout(saveTimer);
    }

    saveTimer = setTimeout(async () => {
      try {
        const payload = cloneHistoryEntries(history.value);

        await idbSet(IDB_KEY_HISTORY, payload);
      } catch (e) {
        console.error('DiceRoller: failed to save history to IDB', e);
      }
    }, 250);
  };

  watch(
    history,
    () => {
      schedulePersistHistory();
    },
    { deep: true },
  );

  watch(
    () => history.value.length,
    async () => {
      await scrollHistoryToBottom();
    },
  );

  onBeforeUnmount(() => {
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = undefined;
    }
  });

  const hasResult = computed(() => {
    return (
      result.value !== '' && result.value !== undefined && result.value !== null
    );
  });

  const isErrorResult = computed(() => {
    return (
      typeof result.value === 'string' && result.value.startsWith('Ошибка:')
    );
  });

  const resultDescription = computed(() => {
    if (!hasResult.value) {
      return '';
    }

    if (isErrorResult.value && typeof result.value === 'string') {
      return result.value.replace(/^Ошибка:\s*/i, '');
    }

    if (typeof result.value === 'number') {
      return result.value.toLocaleString('ru-RU');
    }

    return String(result.value);
  });

  const hasHistory = computed(() => history.value.length > 0);

  const diceDetails = computed(() => lastRollDetails.value);

  const hasDiceDetails = computed(
    () =>
      Array.isArray(lastRollDetails.value) && lastRollDetails.value.length > 0,
  );

  const addHistoryEntry = (payload: {
    formula: string;
    value: string | number;
    isError: boolean;
    detail?: string;
  }) => {
    const { formula, value, isError, detail } = payload;

    if (!formula) {
      return;
    }

    const entry: HistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      formula,
      displayValue:
        typeof value === 'number'
          ? value.toLocaleString('ru-RU')
          : String(value),
      isError,
      timestamp: new Date().toISOString(),
      detail: detail || undefined,
    };

    // ✅ без ограничения по количеству
    history.value = [...history.value, entry];
    void scrollHistoryToBottom();
  };

  const formatHistoryTimestamp = (entry: HistoryEntry) => {
    if (!entry?.timestamp) {
      return '';
    }

    return new Date(entry.timestamp).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const clearHistory = async () => {
    history.value = [];

    try {
      await idbSet(IDB_KEY_HISTORY, []);
      await scrollHistoryToBottom();
    } catch (e) {
      console.error('DiceRoller: failed to clear history in IDB', e);
    }
  };

  const toggleCollapse = (force?: boolean) => {
    if (typeof force === 'boolean') {
      isCollapsed.value = force;

      return;
    }

    isCollapsed.value = !isCollapsed.value;
  };

  const describeDie = (roll: any, index: number): string => {
    const countValue = roll?.count?.value;
    const die = roll?.die;
    const dieType = die?.type;

    let suffix = '?';

    if (dieType === 'fate') {
      suffix = 'кс';
    } else if (dieType === 'number') {
      const dieValue = die?.value;

      if (dieValue === 100) {
        suffix = 'к%';
      } else if (typeof dieValue === 'number') {
        suffix = `к${dieValue}`;
      }
    }

    if (suffix === '?' && roll?.label) {
      return roll.label;
    }

    if (typeof countValue === 'number') {
      return `${countValue}${suffix}`;
    }

    return `Бросок ${index + 1}`;
  };

  const extractRollDetails = (roll: any): DiceDetail[] => {
    const details: DiceDetail[] = [];

    const traverse = (node: any, index: string | number = 0) => {
      if (!node || typeof node !== 'object') {
        return;
      }

      if (node.type === 'die' && Array.isArray(node.rolls)) {
        details.push({
          id: `${index}-${node.order}`,
          label: describeDie(node, details.length),
          total: node.value,
          rolls: node.rolls.map(
            (item: any, rollIndex: number): DiceRollItem => ({
              id: `${index}-${rollIndex}`,
              value: item.value,
              valid: item.valid,
              critical: (item.critical as CriticalType | undefined) ?? null,
            }),
          ),
        });

        return;
      }

      if (Array.isArray(node.dice)) {
        node.dice.forEach((child: any, childIndex: number) =>
          traverse(child, `${index}-${childIndex}`),
        );
      }

      if (node.expr) {
        traverse(node.expr, `${index}-expr`);
      }
    };

    traverse(roll);

    return details;
  };

  const formatDetailSummary = (details: DiceDetail[]): string => {
    if (!Array.isArray(details) || !details.length) {
      return '';
    }

    const chunks = details.map((detail) => {
      const rolls = detail.rolls
        .filter((item) => item.valid)
        .map((item) => item.value)
        .join(' + ');

      if (!rolls) {
        return '';
      }

      return `${detail.label}: ${rolls}`;
    });

    return chunks.filter(Boolean).join(' | ');
  };

  const formatDetailTotal = (value: number | null | undefined): string => {
    return typeof value === 'number'
      ? value.toLocaleString('ru-RU')
      : String(value ?? '');
  };

  const triggerResultAnimation = () => {
    nextTick(() => {
      resultRenderKey.value += 1;
    });
  };

  const rollDice = () => {
    try {
      const formula = (rollFormula.value || '').trim();

      if (!formula) {
        throw new Error('Введите роллформулу');
      }

      const diceRoller = useDiceRoller();
      const { valid, error } = diceRoller.validateWithError(formula);

      if (!valid) {
        throw new Error(error);
      }

      const rollObject: any = diceRoller.roll(formula);
      const value: number = rollObject.value;

      result.value = value;
      lastRollDetails.value = extractRollDetails(rollObject);

      triggerResultAnimation();

      addHistoryEntry({
        formula,
        value,
        isError: false,
        detail: formatDetailSummary(lastRollDetails.value),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Неизвестная ошибка';

      result.value = `Ошибка: ${message}`;
      lastRollDetails.value = [];

      triggerResultAnimation();

      addHistoryEntry({
        formula: (rollFormula.value || '').trim(),
        value: message,
        isError: true,
        detail: undefined,
      });
    }
  };

  const applyExample = (example: string) => {
    rollFormula.value = example;
  };
</script>

<template>
  <Teleport to="body">
    <div
      :class="[
        'pointer-events-none fixed z-[120]',
        isCollapsed
          ? 'w-auto'
          : 'w-[calc(100vw-32px)] max-w-[364px] md:max-w-[380px]',
      ]"
      :style="{
        right: 'calc(16px + var(--safe-area-inset-right, 0px))',
        bottom: 'calc(16px + var(--safe-area-inset-bottom, 0px))',
      }"
      role="region"
      aria-live="polite"
    >
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-2"
      >
        <section
          v-if="!isCollapsed"
          key="expanded"
          class="pointer-events-auto relative flex max-h-[80vh] w-full flex-col overflow-hidden rounded-xl border border-[var(--ui-border)] p-4 shadow-[0_25px_60px_rgba(8,15,17,0.25)] backdrop-blur-[14px]"
          :style="{
            background:
              'linear-gradient(160deg, var(--ui-bg-elevated) 0%, var(--ui-bg) 55%, var(--ui-bg-accented) 100%)',
          }"
        >
          <div class="flex items-center justify-end gap-2 pb-3">
            <div class="relativ group">
              <button
                type="button"
                class="group inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] text-[var(--ui-text-muted)] transition hover:border-[var(--color-primary-500)] hover:text-[var(--ui-text-highlighted)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500)] focus-visible:outline-none"
                aria-label="Как пользоваться роллером"
              >
                <UIcon name="i-fluent-info-16-regular" />

                <div
                  class="invisible absolute top-10 right-0 z-10 max-h-80 max-w-[420px] min-w-[320px] space-y-3 overflow-y-auto rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] p-4 text-sm text-[var(--ui-text)] opacity-0 shadow-[0_12px_30px_rgba(0,0,0,0.25)] transition group-hover:visible group-hover:opacity-100 group-focus-visible:visible group-focus-visible:opacity-100"
                >
                  <p class="font-semibold">Базовые броски</p>

                  <ul class="flex flex-wrap gap-2">
                    <li class="flex-1">
                      <button
                        type="button"
                        class="flex w-full flex-col gap-1 rounded-lg border border-transparent px-2 py-1 text-left transition hover:border-[var(--ui-border)] hover:bg-[var(--ui-bg)]"
                        @click.left.exact.prevent="applyExample('к20')"
                      >
                        <span
                          class="font-semibold text-[var(--ui-text-highlighted)]"
                        >
                          к20
                        </span>

                        <span class="text-xs text-[var(--ui-text-muted)]">
                          одиночный куб
                        </span>
                      </button>
                    </li>

                    <li class="flex-1">
                      <button
                        type="button"
                        class="flex w-full flex-col gap-1 rounded-lg border border-transparent px-2 py-1 text-left transition hover:border-[var(--ui-border)] hover:bg-[var(--ui-bg)]"
                        @click.left.exact.prevent="applyExample('2к6+3')"
                      >
                        <span
                          class="font-semibold text-[var(--ui-text-highlighted)]"
                        >
                          2к6+3
                        </span>

                        <span class="text-xs text-[var(--ui-text-muted)]">
                          сумма с модификатором
                        </span>
                      </button>
                    </li>

                    <li class="flex-1">
                      <button
                        type="button"
                        class="flex w-full flex-col gap-1 rounded-lg border border-transparent px-2 py-1 text-left transition hover:border-[var(--ui-border)] hover:bg-[var(--ui-bg)]"
                        @click.left.exact.prevent="applyExample('(4к6вх3+2)*2')"
                      >
                        <span
                          class="font-semibold text-[var(--ui-text-highlighted)]"
                        >
                          (4к6вх3+2)*2
                        </span>

                        <span class="text-xs text-[var(--ui-text-muted)]">
                          группировка
                        </span>
                      </button>
                    </li>
                  </ul>

                  <p class="pt-1 font-semibold">Лучшие / худшие</p>

                  <ul class="flex flex-wrap gap-2">
                    <li
                      v-for="example in [
                        {
                          formula: '4к6вх3',
                          note: 'оставить лучшие (kh3)',
                        },
                        {
                          formula: '3к8вл1',
                          note: 'оставить худшие (kl1)',
                        },
                        { formula: '5к10ул2', note: 'убрать лучшие (dh2)' },
                        { formula: '5к10ух2', note: 'убрать худшие (dl2)' },
                      ]"
                      :key="`keep-${example.formula}`"
                      class="flex-1"
                    >
                      <button
                        type="button"
                        class="flex w-full flex-col gap-1 rounded-lg border border-transparent px-2 py-1 text-left transition hover:border-[var(--ui-border)] hover:bg-[var(--ui-bg)]"
                        @click.left.exact.prevent="
                          applyExample(example.formula)
                        "
                      >
                        <span
                          class="font-semibold text-[var(--ui-text-highlighted)]"
                        >
                          {{ example.formula }}
                        </span>

                        <span class="text-xs text-[var(--ui-text-muted)]">
                          — {{ example.note }}
                        </span>
                      </button>
                    </li>
                  </ul>

                  <p class="pt-1 font-semibold">Перебросы</p>

                  <ul class="flex flex-wrap gap-2">
                    <li
                      v-for="example in [
                        { formula: 'к20пр1', note: 'переброс 1 (ro1)' },
                        { formula: '10к6пб2', note: 'переброс 2 (r2)' },
                        { formula: '8к6р<3', note: 'переброс <3' },
                      ]"
                      :key="`reroll-${example.formula}`"
                      class="flex-1"
                    >
                      <button
                        type="button"
                        class="flex w-full flex-col gap-1 rounded-lg border border-transparent px-2 py-1 text-left transition hover:border-[var(--ui-border)] hover:bg-[var(--ui-bg)]"
                        @click.left.exact.prevent="
                          applyExample(example.formula)
                        "
                      >
                        <span
                          class="font-semibold text-[var(--ui-text-highlighted)]"
                        >
                          {{ example.formula }}
                        </span>

                        <span class="text-xs text-[var(--ui-text-muted)]">
                          — {{ example.note }}
                        </span>
                      </button>
                    </li>
                  </ul>

                  <p class="pt-1 text-xs text-[var(--ui-text-muted)]">
                    Поддерживаются: к, кс, вх/вл, ул/ух, пр/пб, !/!!/!п, с, п,
                    св/су
                  </p>
                </div>
              </button>
            </div>

            <UButton
              icon="i-fluent-delete-16-regular"
              variant="ghost"
              color="neutral"
              size="xs"
              aria-label="Очистить историю"
              @click.left.exact.prevent="clearHistory"
            />

            <UButton
              icon="i-fluent-dismiss-16-regular"
              variant="ghost"
              color="neutral"
              size="xs"
              aria-label="Закрыть роллер"
              @click.left.exact.prevent="toggleCollapse(true)"
            />
          </div>

          <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
            <div
              v-if="hasHistory"
              class="flex flex-col gap-3"
            >
              <div class="flex items-center justify-between gap-3">
                <div>
                  <p class="m-0 font-semibold text-[var(--ui-text)]">
                    История бросков
                  </p>
                </div>
              </div>

              <div
                ref="historyScrollEl"
                class="max-h-56 overflow-y-auto pr-1"
              >
                <TransitionGroup
                  tag="ul"
                  class="flex flex-col gap-2"
                  enter-active-class="transition duration-200 ease-out"
                  enter-from-class="opacity-0 translate-y-1"
                  enter-to-class="opacity-100 translate-y-0"
                  leave-active-class="transition duration-150 ease-in"
                  leave-from-class="opacity-100 translate-y-0"
                  leave-to-class="opacity-0 translate-y-1"
                  move-class="transition duration-200"
                >
                  <li
                    v-for="entry in history"
                    :key="entry.id"
                    :class="[
                      'flex items-center justify-between gap-3 rounded-2xl border px-3 py-2 text-sm',
                      entry.isError
                        ? 'border-[color:color-mix(in_srgb,var(--ui-color-error-500)_25%,transparent)]'
                        : 'border-[color:color-mix(in_srgb,var(--ui-color-success-500)_25%,transparent)]',
                    ]"
                    :style="{
                      background:
                        'color-mix(in srgb, var(--ui-bg) 85%, transparent)',
                    }"
                  >
                    <div class="flex min-w-0 flex-col gap-1">
                      <p
                        class="m-0 truncate font-semibold text-[var(--ui-text-highlighted)]"
                      >
                        {{ entry.formula }}
                      </p>

                      <span class="text-xs text-[var(--ui-text-muted)]">
                        {{ formatHistoryTimestamp(entry) }}
                      </span>

                      <p
                        v-if="entry.detail"
                        class="m-0 text-xs text-[var(--ui-text-muted)]"
                      >
                        {{ entry.detail }}
                      </p>
                    </div>

                    <span
                      class="font-mono text-base font-semibold text-[var(--ui-text-highlighted)]"
                    >
                      {{ entry.displayValue }}
                    </span>
                  </li>
                </TransitionGroup>
              </div>
            </div>

            <div class="flex flex-col gap-3">
              <div
                v-if="isErrorResult"
                class="rounded-2xl border border-[var(--ui-color-error-500)] px-4 py-3 text-sm text-[var(--ui-color-error-500)]"
                :style="{
                  background:
                    'color-mix(in srgb, var(--ui-color-error-500) 8%, var(--ui-bg-elevated))',
                }"
              >
                {{ resultDescription }}
              </div>

              <Transition
                v-else
                enter-active-class="transition duration-200 ease-out"
                enter-from-class="opacity-0 scale-95"
                enter-to-class="opacity-100 scale-100"
                leave-active-class="transition duration-150 ease-in"
                leave-from-class="opacity-100 scale-100"
                leave-to-class="opacity-0 scale-95"
                mode="out-in"
              >
                <div
                  v-if="hasDiceDetails"
                  :key="`details-${resultRenderKey}`"
                  class="flex max-h-56 flex-col gap-3 overflow-y-auto pr-1"
                >
                  <div
                    v-for="detail in diceDetails"
                    :key="detail.id"
                    class="rounded-2xl border border-[var(--ui-border)] px-3 py-3"
                    :style="{
                      background:
                        'color-mix(in srgb, var(--ui-bg-elevated) 85%, transparent)',
                    }"
                  >
                    <div
                      class="mb-2 flex items-center justify-between text-sm font-semibold text-[var(--ui-text)]"
                    >
                      <span>{{ detail.label }}</span>

                      <span class="text-[var(--ui-text-highlighted)]">
                        {{ formatDetailTotal(detail.total) }}
                      </span>
                    </div>

                    <ul class="flex flex-wrap gap-2">
                      <li
                        v-for="roll in detail.rolls"
                        :key="roll.id"
                        :class="[
                          'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold',
                          roll.valid
                            ? 'border-[color:color-mix(in_srgb,var(--ui-color-primary-500)_40%,transparent)] text-[var(--ui-text-highlighted)]'
                            : 'border-[var(--ui-border)] line-through opacity-60',
                        ]"
                        :style="{ background: 'var(--ui-bg-elevated)' }"
                      >
                        <span>{{ roll.value }}</span>

                        <UBadge
                          v-if="
                            roll.critical === 'success' ||
                            roll.critical === 'failure'
                          "
                          :color="
                            roll.critical === 'success' ? 'success' : 'error'
                          "
                          variant="subtle"
                          size="xs"
                        >
                          {{ roll.critical === 'success' ? 'крит' : 'фейл' }}
                        </UBadge>
                      </li>
                    </ul>
                  </div>
                </div>

                <div
                  v-else
                  key="placeholder"
                  class="flex min-h-[112px] items-center rounded-2xl border border-dashed border-[var(--ui-border)] px-4 py-3 text-sm text-[var(--ui-text-muted)]"
                  :style="{
                    background:
                      'linear-gradient(135deg, var(--ui-bg) 0%, var(--ui-bg-elevated) 100%)',
                  }"
                >
                  Введите формулу и нажмите кнопку справа или клавишу Enter.
                </div>
              </Transition>
            </div>
          </div>

          <form
            class="mt-3 flex items-center gap-2 border-t border-[var(--ui-border)] pt-3"
            @submit.prevent="rollDice"
          >
            <UInput
              id="dice-roll-formula"
              v-model="rollFormula"
              placeholder="Например: 4к6вх3+2"
              size="xl"
              class="w-full"
            />

            <button
              type="submit"
              class="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] shadow-[0_10px_20px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_24px_rgba(0,0,0,0.22)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500)] focus-visible:outline-none"
              aria-label="Бросить кубы"
              title="Бросить"
            >
              <img
                :src="DiceD20IconUrl"
                alt="D20"
                class="h-5 w-5 transition dark:invert svifty7:invert"
              />
            </button>
          </form>
        </section>

        <button
          v-else
          key="collapsed"
          type="button"
          class="pointer-events-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] text-[var(--ui-text)] shadow-[0_12px_25px_rgba(0,0,0,0.2)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(0,0,0,0.3)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500)] focus-visible:outline-none"
          aria-label="Открыть роллер кубов"
          @click.left.exact.prevent="toggleCollapse(false)"
        >
          <img
            :src="DiceD20IconUrl"
            alt="D20"
            class="h-5 w-5 transition dark:invert svifty7:invert"
          />
        </button>
      </Transition>
    </div>
  </Teleport>
</template>
