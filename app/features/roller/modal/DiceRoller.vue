<script setup lang="ts">
  import { onMounted, ref } from 'vue';

  import { useDiceRoller } from '~/composables/useDiceRoller';

  import { useDiceRollerHistory } from '../composables/useDiceRollerHistory';
  import { useDiceRollerState } from '../composables/useDiceRollerState';
  import DiceRollerComposer from '../ui/DiceRollerComposer.vue';
  import DiceRollerHistory from '../ui/DiceRollerHistory.vue';
  import { extractRollDetails, formatDetailSummary } from '../utils';

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

  function rollDice() {
    try {
      const formula = state.formula.value.trim();

      if (!formula) {
        throw new Error('Введите формулу');
      }

      const diceRoller = useDiceRoller();
      const { valid, error } = diceRoller.validateWithError(formula);

      if (!valid) {
        throw new Error(error);
      }

      const rollObject: any = diceRoller.roll(formula);
      const value: number = rollObject.value;

      state.result.value = value.toLocaleString('ru-RU');
      state.details.value = extractRollDetails(rollObject);

      state.bumpResultKey();

      state.addHistoryEntry({
        formula,
        value: state.result.value,
        isError: false,
        detail: formatDetailSummary(state.details.value),
        structuredDetails: state.details.value,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Неизвестная ошибка';

      state.result.value = `Ошибка: ${message}`;
      state.details.value = [];

      state.bumpResultKey();

      state.addHistoryEntry({
        formula: state.formula.value.trim(),
        value: message,
        isError: true,
      });
    }
  }

  /* Resizing Logic */
  const modalHeight = ref(450);
  const isResizing = ref(false);
  const startY = ref(0);
  const startHeight = ref(0);

  function startResize(e: MouseEvent) {
    isResizing.value = true;
    startY.value = e.clientY;
    startHeight.value = modalHeight.value;

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', stopResize);
    document.body.style.userSelect = 'none';
  }

  function onMouseMove(e: MouseEvent) {
    if (!isResizing.value) {
      return;
    }

    const delta = startY.value - e.clientY;
    // Min 300px, Max 90vh
    const maxHeight = window.innerHeight * 0.9;

    modalHeight.value = Math.max(
      300,
      Math.min(maxHeight, startHeight.value + delta),
    );
  }

  function stopResize() {
    isResizing.value = false;
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', stopResize);
    document.body.style.userSelect = '';
  }
</script>

<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="opacity-0 translate-y-4 scale-95"
    enter-to-class="opacity-100 translate-y-0 scale-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="opacity-100 translate-y-0 scale-100"
    leave-to-class="opacity-0 translate-y-4 scale-95"
  >
    <section
      v-if="state.isOpen.value"
      class="fixed right-4 bottom-20 z-[120] w-[calc(100vw-32px)] max-w-[420px]"
    >
      <div
        class="relative flex flex-col overflow-hidden rounded-md border border-[var(--ui-border)] p-4 pt-5 shadow-[0_25px_60px_rgba(8,15,17,0.25)] backdrop-blur-[14px]"
        :style="{
          height: `${modalHeight}px`,
          background:
            'linear-gradient(160deg, var(--ui-bg-elevated) 0%, var(--ui-bg) 55%, var(--ui-bg-accented) 100%)',
        }"
      >
        <!-- Resize Handle -->
        <div
          class="absolute top-0 right-0 left-0 z-50 flex h-4 cursor-ns-resize items-start justify-center hover:bg-[var(--ui-bg-accented)]/50"
          @mousedown="startResize"
        >
          <div class="mt-1.5 h-1 w-8 rounded-full bg-[var(--ui-border)]"></div>
        </div>

        <div
          class="flex items-center justify-between gap-2 border-b border-[var(--ui-border)] pb-3"
        >
          <div class="min-w-0">
            <p class="m-0 truncate font-semibold text-[var(--ui-text)]">
              История бросков
            </p>
          </div>

          <div>
            <UButton
              icon="i-fluent-delete-16-regular"
              variant="ghost"
              color="neutral"
              size="xs"
              aria-label="Очистить историю"
              @click="historyApi.clear()"
            />
          </div>
        </div>

        <div class="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden">
          <DiceRollerHistory>
            <template #scroller="{ formatTime }">
              <div
                ref="historyScrollEl"
                class="flex h-full flex-col overflow-y-auto pr-1"
              >
                <ul class="mt-auto flex flex-col gap-2 pt-4">
                  <li
                    v-for="entry in state.history.value"
                    :key="entry.id"
                    class="flex items-start gap-4 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] p-2 shadow-sm transition hover:border-[var(--ui-border-hovered)]"
                  >
                    <!-- Left: Large Result -->
                    <div
                      class="flex min-w-[2rem] shrink-0 flex-col items-center justify-center gap-1"
                    >
                      <span
                        class="text-3xl leading-none font-bold tracking-tight text-primary"
                      >
                        {{ entry.displayValue }}
                      </span>
                    </div>

                    <!-- Right: Details -->
                    <div class="flex min-w-0 flex-1 flex-col gap-2">
                      <div class="flex items-center justify-between gap-2">
                        <p class="truncate font-medium text-[var(--ui-text)]">
                          {{ entry.formula }}
                        </p>

                        <span
                          class="shrink-0 text-xs text-[var(--ui-text-muted)]"
                        >
                          {{ formatTime(entry.timestamp) }}
                        </span>
                      </div>

                      <!-- Structured Details (Chips) -->
                      <div
                        v-if="entry.structuredDetails?.length"
                        class="flex flex-col gap-2"
                      >
                        <div
                          v-for="detail in entry.structuredDetails"
                          :key="detail.id"
                          class="flex flex-wrap gap-1"
                        >
                          <div
                            v-for="roll in detail.rolls"
                            :key="roll.id"
                            :class="[
                              'inline-flex h-6 min-w-[24px] items-center justify-center rounded px-1.5 text-xs font-semibold',
                              roll.valid
                                ? 'bg-[var(--ui-bg-accented)] text-[var(--ui-text)]'
                                : 'bg-[var(--ui-bg-muted)] text-[var(--ui-text-muted)] line-through opacity-60',
                              roll.critical === 'success' &&
                                '!bg-[var(--color-success-500)] !text-white',
                              roll.critical === 'failure' &&
                                '!bg-[var(--color-error-500)] !text-white',
                            ]"
                          >
                            {{ roll.value }}
                          </div>
                        </div>
                      </div>

                      <!-- Fallback to text detail if structured is missing -->
                      <p
                        v-else-if="entry.detail"
                        class="text-xs text-[var(--ui-text-muted)]"
                      >
                        {{ entry.detail }}
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </template>
          </DiceRollerHistory>
        </div>

        <DiceRollerComposer :on-submit="rollDice" />
      </div>
    </section>
  </Transition>
</template>
