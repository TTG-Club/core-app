<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import { useDiceRollerHistory } from '~dice-roller/composables/useDiceRollerHistory';
  import { useDiceRollerState } from '~dice-roller/composables/useDiceRollerState';
  import { Composer, History } from '~dice-roller/ui';
  import {
    extractRollDetails,
    formatDetailSummary,
    getRollValue,
  } from '~dice-roller/utils';

  import { useDiceRoller } from '~/composables/useDiceRoller';

  const state = useDiceRollerState();

  const historyScrollEl = ref<HTMLElement | null>(null);

  const historyApi = useDiceRollerHistory({
    history: state.history,
    historyScrollEl,
    isOpen: state.isOpen,
  });

  onMounted(() => {
    historyApi.load();
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

      const rollObject = diceRoller.roll(formula) as unknown;
      const value = getRollValue(rollObject);

      state.result.value = Number.isFinite(value)
        ? value.toLocaleString('ru-RU')
        : String(value);

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
  const { smaller } = useBreakpoints();
  const isMobile = smaller(Breakpoint.MD);

  const MIN_MODAL_HEIGHT_PX = 300;
  const MAX_HEIGHT_VH_RATIO = 0.9;
  const modalHeight = ref(450);
  const isResizing = ref(false);
  const startY = ref(0);
  const startHeight = ref(0);

  function startResize(e: MouseEvent) {
    if (isMobile.value) {
      return;
    }

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
    const maxHeight = window.innerHeight * MAX_HEIGHT_VH_RATIO;

    modalHeight.value = Math.max(
      MIN_MODAL_HEIGHT_PX,
      Math.min(maxHeight, startHeight.value + delta),
    );
  }

  function stopResize() {
    isResizing.value = false;
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', stopResize);
    document.body.style.userSelect = '';
  }

  /* Scroll Lock */
  const isLocked = useScrollLock(document.body);

  watchEffect(() => {
    isLocked.value = isMobile.value && state.isOpen.value;
  });
</script>

<template>
  <!-- Mobile Backdrop -->
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
      class="fixed inset-0 z-[95] bg-gray-900/50 backdrop-blur-[2px]"
      @click.left.exact.prevent="state.close()"
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
      class="fixed inset-x-4 top-4 bottom-20 z-[120] md:inset-auto md:right-4 md:bottom-20 md:w-[420px]"
    >
      <div
        class="relative flex flex-col overflow-hidden rounded-md border border-default p-4 pt-5 shadow-[0_25px_60px_rgba(8,15,17,0.25)] backdrop-blur-[14px]"
        :style="{
          height: isMobile ? '100%' : `${modalHeight}px`,
          backgroundImage:
            'linear-gradient(160deg, var(--ui-bg-elevated) 0%, var(--ui-bg) 55%, var(--ui-bg-accented) 100%)',
        }"
      >
        <!-- Resize Handle -->
        <div
          v-if="!isMobile"
          class="absolute top-0 right-0 left-0 z-50 flex h-4 cursor-ns-resize items-start justify-center hover:bg-accented/50"
          @mousedown="startResize"
        >
          <div class="mt-1.5 h-1 w-8 rounded-full bg-default"></div>
        </div>

        <div
          class="flex items-center justify-between gap-2 border-b border-default pb-3"
        >
          <div class="min-w-0">
            <p class="m-0 truncate font-semibold text-default">
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
              @click.left.exact.prevent="historyApi.clear()"
            />
          </div>
        </div>

        <div class="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden">
          <History>
            <template #scroller="{ formatTime }">
              <div
                ref="historyScrollEl"
                class="flex h-full flex-col overflow-y-auto pr-1"
              >
                <ul class="mt-auto flex flex-col gap-2 pt-4">
                  <li
                    v-for="entry in state.history.value"
                    :key="entry.id"
                    class="flex items-start gap-4 rounded-xl border border-default bg-elevated p-2 transition hover:border-primary"
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
                        <p class="truncate font-medium text-default">
                          {{ entry.formula }}
                        </p>

                        <span class="shrink-0 text-xs text-muted">
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
                          <UBadge
                            v-for="roll in detail.rolls"
                            :key="roll.id"
                            color="neutral"
                            variant="subtle"
                            :class="[
                              'h-6 min-w-[24px] justify-center px-1.5 text-xs font-semibold',
                              roll.valid
                                ? 'bg-accented text-default'
                                : 'bg-muted text-muted line-through opacity-60',
                              roll.critical === 'success' &&
                                '!bg-success-500 !text-white',
                              roll.critical === 'failure' &&
                                '!bg-error-500 !text-white',
                            ]"
                          >
                            {{ roll.value }}
                          </UBadge>
                        </div>
                      </div>

                      <!-- Fallback to text detail if structured is missing -->
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
            </template>
          </History>
        </div>

        <Composer :on-submit="rollDice" />
      </div>
    </section>
  </Transition>
</template>
