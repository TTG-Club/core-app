<script setup lang="ts">
  import {
    useDiceRoller,
    useDiceRollerHistory,
    useDiceRollerState,
  } from '~dice-roller/composables';
  import { DiceRollerComposer } from '~dice-roller/ui';
  import {
    extractDiceRollDetails,
    extractRollValue,
    formatDiceDetailsSummary,
  } from '~dice-roller/utils';

  const state = useDiceRollerState();

  const historyScrollElement = ref<HTMLElement | null>(null);

  const historyActions = useDiceRollerHistory({
    history: state.history,
    historyScrollElement,
    isModalOpen: state.isOpen,
  });

  const dayjs = useDayjs();

  function formatDateTime(iso: string) {
    const date = dayjs(iso);

    if (!date.isValid()) {
      return undefined;
    }

    return date.local().format('LLL');
  }

  onMounted(async () => {
    await historyActions.loadHistory();
  });

  function executeRoll() {
    try {
      const formulaValue = state.formula.value.trim();

      if (!formulaValue) {
        throw new Error('Введите формулу');
      }

      const diceRoller = useDiceRoller();
      const { valid, error } = diceRoller.validateWithError(formulaValue);

      if (!valid) {
        throw new Error(error);
      }

      const rollResult = diceRoller.roll(formulaValue) as unknown;
      const numericValue = extractRollValue(rollResult);

      state.result.value = Number.isFinite(numericValue)
        ? numericValue.toLocaleString('ru-RU')
        : String(numericValue);

      state.details.value = extractDiceRollDetails(rollResult);

      state.incrementResultKey();

      state.addHistoryEntry({
        formula: formulaValue,
        value: state.result.value,
        isError: false,
        detail: formatDiceDetailsSummary(state.details.value),
        structuredDetails: state.details.value,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Неизвестная ошибка';

      state.result.value = `Ошибка: ${errorMessage}`;
      state.details.value = [];

      state.incrementResultKey();

      state.addHistoryEntry({
        formula: state.formula.value.trim(),
        value: errorMessage,
        isError: true,
      });
    }
  }

  const { smaller } = useBreakpoints();
  const isMobile = smaller(Breakpoint.MD);

  const MODAL_MIN_HEIGHT = 300;
  const MODAL_MAX_HEIGHT_RATIO = 0.9;
  const modalHeight = ref(450);
  const isResizing = ref(false);
  const resizeStartY = ref(0);
  const resizeStartHeight = ref(0);

  function handleResizeStart(event: MouseEvent) {
    if (isMobile.value) {
      return;
    }

    isResizing.value = true;
    resizeStartY.value = event.clientY;
    resizeStartHeight.value = modalHeight.value;

    window.addEventListener('mousemove', handleResizeMove);
    window.addEventListener('mouseup', handleResizeEnd);
    document.body.style.userSelect = 'none';
  }

  function handleResizeMove(event: MouseEvent) {
    if (!isResizing.value) {
      return;
    }

    const delta = resizeStartY.value - event.clientY;
    const maxHeight = window.innerHeight * MODAL_MAX_HEIGHT_RATIO;

    modalHeight.value = Math.max(
      MODAL_MIN_HEIGHT,
      Math.min(maxHeight, resizeStartHeight.value + delta),
    );
  }

  function handleResizeEnd() {
    isResizing.value = false;
    window.removeEventListener('mousemove', handleResizeMove);
    window.removeEventListener('mouseup', handleResizeEnd);
    document.body.style.userSelect = '';
  }

  const isScrollLocked = useScrollLock(document.body);

  watchEffect(() => {
    isScrollLocked.value = isMobile.value && state.isOpen.value;
  });
</script>

<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="isMobile && state.isOpen.value"
      class="fixed inset-0 z-95 bg-gray-900/50 backdrop-blur-[2px]"
      @click.left.exact.prevent="state.closeModal()"
    />
  </Transition>

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
      class="fixed inset-x-4 top-4 bottom-20 z-120 md:inset-auto md:right-4 md:bottom-20 md:w-105"
    >
      <div
        class="relative flex flex-col overflow-hidden rounded-md border border-default p-4 pt-5 shadow-[0_25px_60px_rgba(8,15,17,0.25)] backdrop-blur-[14px]"
        :style="{
          height: isMobile ? '100%' : `${modalHeight}px`,
          background:
            'linear-gradient(160deg, var(--ui-bg-elevated) 0%, var(--ui-bg) 55%, var(--ui-bg-accented) 100%)',
        }"
      >
        <div
          v-if="!isMobile"
          class="absolute top-0 right-0 left-0 z-50 flex h-4 cursor-ns-resize items-start justify-center hover:bg-accented/50"
          @mousedown="handleResizeStart"
        >
          <div class="mt-1.5 h-1 w-8 rounded-full bg-default" />
        </div>

        <div
          class="flex items-center justify-between gap-2 border-b border-default pb-3"
        >
          <div class="min-w-0">
            <p class="m-0 truncate font-semibold text-default">
              История бросков
            </p>
          </div>

          <UButton
            icon="i-fluent-delete-16-regular"
            variant="ghost"
            color="neutral"
            size="xs"
            aria-label="Очистить историю"
            @click.left.exact.prevent="historyActions.clearHistory()"
          />
        </div>

        <div
          v-if="state.history"
          class="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div class="flex h-full min-h-0 flex-col gap-3">
            <div
              ref="historyScrollElement"
              class="flex h-full flex-col overflow-y-auto pr-1"
            >
              <ul class="mt-auto flex flex-col gap-2 pt-4">
                <li
                  v-for="entry in state.history.value"
                  :key="entry.id"
                  class="flex items-start gap-4 rounded-xl border border-default bg-elevated p-2 transition hover:border-primary"
                >
                  <div
                    class="flex min-w-8 shrink-0 flex-col items-center justify-center gap-1"
                  >
                    <span
                      class="text-3xl leading-none font-bold tracking-tight text-primary"
                    >
                      {{ entry.displayValue }}
                    </span>
                  </div>

                  <div class="flex min-w-0 flex-1 flex-col gap-2">
                    <div class="flex items-center justify-between gap-2">
                      <p class="truncate font-medium text-default">
                        {{ entry.formula }}
                      </p>

                      <NuxtTime
                        :title="formatDateTime(entry.timestamp)"
                        :datetime="entry.timestamp"
                        class="shrink-0 text-xs text-muted"
                        relative-style="long"
                        locale="ru-RU"
                        relative
                      />
                    </div>

                    <div
                      v-if="entry.structuredDetails?.length"
                      class="flex flex-col gap-2"
                    >
                      <div
                        v-for="detail in entry.structuredDetails"
                        :key="detail.id"
                        class="flex flex-wrap gap-1"
                      >
                        <UBadge
                          v-for="roll in detail.rolls"
                          :key="roll.id"
                          :color="
                            roll.critical === 'success'
                              ? 'success'
                              : roll.critical === 'failure'
                                ? 'error'
                                : 'neutral'
                          "
                          :variant="roll.valid ? 'subtle' : 'outline'"
                          :class="[
                            'min-w-6 justify-center',
                            !roll.valid && 'line-through opacity-60',
                          ]"
                        >
                          {{ roll.value }}
                        </UBadge>
                      </div>
                    </div>

                    <p
                      v-else-if="entry.detail"
                      class="text-xs text-muted"
                    >
                      {{ entry.detail }}
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <DiceRollerComposer :on-submit="executeRoll" />
      </div>
    </section>
  </Transition>
</template>
