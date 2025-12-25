<script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import { useDiceRoller } from '~/composables/useDiceRoller';
  import type {
    DiceDetail,
    DiceRollItem,
    HistoryEntry,
    CriticalType,
  } from '../types';
  import DiceRollerHelpPopover from '../ui/DiceRollerHelpPopover.vue';
  import DiceRollerHistory from '../ui/DiceRollerHistory.vue';
  import DiceRollerResult from '../ui/DiceRollerResult.vue';
  import DiceRollerComposer from '../ui/DiceRollerComposer.vue';
  import { useDiceRollerHistory } from '../composables/useDiceRollerHistory';
  import { useDiceRollerState } from '../composables/useDiceRollerState';

  const state = useDiceRollerState();

  const historyScrollEl = ref<HTMLElement | null>(null);

  const historyApi = useDiceRollerHistory({
    history: state.history,
    historyScrollEl,
    isOpen: state.isOpen,
  });

  onMounted(async () => {
    await historyApi.load();
  });

  function describeDie(
    roll: {
      count?: { value?: number };
      die?: { type?: string; value?: number };
      label?: string;
    },
    index: number,
  ): string {
    const countValue = roll.count?.value;
    const dieType = roll.die?.type;

    let suffix = '?';

    if (dieType === 'fate') {
      suffix = 'кс';
    } else if (dieType === 'number') {
      const dieValue = roll.die?.value;

      if (dieValue === 100) suffix = 'к%';
      else if (typeof dieValue === 'number') suffix = `к${dieValue}`;
    }

    if (suffix === '?' && roll.label) return roll.label;
    if (typeof countValue === 'number') return `${countValue}${suffix}`;

    return `Бросок ${index + 1}`;
  }

  function extractRollDetails(roll: any): DiceDetail[] {
    const details: DiceDetail[] = [];

    const traverse = (node: any, index: string | number = 0) => {
      if (!node || typeof node !== 'object') return;

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
  }

  function formatDetailSummary(details: DiceDetail[]): string {
    const chunks = details
      .map((detail) => {
        const rolls = detail.rolls
          .filter((item) => item.valid)
          .map((item) => item.value)
          .join(' + ');

        return rolls ? `${detail.label}: ${rolls}` : '';
      })
      .filter(Boolean);

    return chunks.join(' | ');
  }

  function newId(): string {
    return crypto.randomUUID();
  }

  function addHistoryEntry(payload: {
    formula: string;
    value: string;
    isError: boolean;
    detail?: string;
  }) {
    if (!payload.formula) return;

    const entry: HistoryEntry = {
      id: newId(),
      formula: payload.formula,
      displayValue: payload.value,
      isError: payload.isError,
      timestamp: new Date().toISOString(),
      detail: payload.detail || undefined,
    };

    state.history.value = [...state.history.value, entry];
  }

  function rollDice() {
    try {
      const formula = state.formula.value.trim();

      if (!formula) throw new Error('Введите роллформулу');

      const diceRoller = useDiceRoller();
      const { valid, error } = diceRoller.validateWithError(formula);

      if (!valid) throw new Error(error);

      const rollObject: any = diceRoller.roll(formula);
      const value: number = rollObject.value;

      state.result.value = value.toLocaleString('ru-RU');
      state.details.value = extractRollDetails(rollObject);

      state.bumpResultKey();

      addHistoryEntry({
        formula,
        value: state.result.value,
        isError: false,
        detail: formatDetailSummary(state.details.value),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Неизвестная ошибка';

      state.result.value = `Ошибка: ${message}`;
      state.details.value = [];

      state.bumpResultKey();

      addHistoryEntry({
        formula: state.formula.value.trim(),
        value: message,
        isError: true,
      });
    }
  }
</script>

<template>
  <section
    v-if="state.isOpen.value"
    class="fixed right-4 bottom-4 z-[120] w-[calc(100vw-32px)] max-w-[420px]"
  >
    <div
      class="flex max-h-[80vh] flex-col overflow-hidden rounded-md border border-[var(--ui-border)] p-4 shadow-[0_25px_60px_rgba(8,15,17,0.25)] backdrop-blur-[14px]"
      :style="{
        background:
          'linear-gradient(160deg, var(--ui-bg-elevated) 0%, var(--ui-bg) 55%, var(--ui-bg-accented) 100%)',
      }"
    >
      <div class="flex items-center justify-end gap-2 pb-3">
        <DiceRollerHelpPopover />

        <UButton
          icon="i-fluent-delete-16-regular"
          variant="ghost"
          color="neutral"
          size="xs"
          aria-label="Очистить историю"
          @click="historyApi.clear()"
        />

        <UButton
          icon="i-fluent-dismiss-16-regular"
          variant="ghost"
          color="neutral"
          size="xs"
          aria-label="Закрыть роллер"
          @click="state.close()"
        />
      </div>

      <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
        <DiceRollerHistory>
          <template #scroller="{ formatTime }">
            <div
              ref="historyScrollEl"
              class="max-h-56 overflow-y-auto pr-1"
            >
              <ul class="flex flex-col gap-2">
                <li
                  v-for="entry in state.history.value"
                  :key="entry.id"
                  class="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"
                >
                  <div class="flex min-w-0 flex-col gap-1">
                    <p class="truncate font-semibold">
                      {{ entry.formula }}
                    </p>

                    <span class="text-xs text-muted">
                      {{ formatTime(entry.timestamp) }}
                    </span>

                    <p
                      v-if="entry.detail"
                      class="text-xs"
                    >
                      {{ entry.detail }}
                    </p>
                  </div>

                  <span class="font-mono font-semibold">
                    {{ entry.displayValue }}
                  </span>
                </li>
              </ul>
            </div>
          </template>
        </DiceRollerHistory>

        <DiceRollerResult />
      </div>

      <DiceRollerComposer :on-submit="rollDice" />
    </div>
  </section>
</template>
