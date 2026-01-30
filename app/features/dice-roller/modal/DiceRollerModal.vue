<script setup lang="ts">
  import {
    useDiceRoller,
    useDiceRollerHistory,
    useDiceRollerState,
    useResizableHeight,
  } from '~dice-roller/composables';
  import {
    DICE_MODAL_INITIAL_HEIGHT,
    DICE_MODAL_MAX_HEIGHT_RATIO,
    DICE_MODAL_MIN_HEIGHT,
  } from '~dice-roller/const';
  import {
    extractDiceRollDetails,
    extractRollValue,
    formatDiceDetailsSummary,
  } from '~dice-roller/utils';

  import {
    DiceRollerComposer,
    DiceRollerHelpPopover,
    DiceRollerHistoryItem,
    DiceRollerHistoryList,
  } from './ui';

  const state = useDiceRollerState();
  const diceRoller = useDiceRoller();

  const historyScrollElement = ref<HTMLElement | null>(null);

  const historyActions = useDiceRollerHistory({
    history: state.history,
    historyScrollElement,
    isModalOpen: state.isOpen,
  });

  onMounted(async () => {
    await historyActions.loadHistory();
  });

  function handleRollError(message: string, formulaValue: string) {
    state.result.value = `Ошибка: ${message}`;
    state.details.value = [];
    state.incrementResultKey();

    state.addHistoryEntry({
      formula: formulaValue,
      value: message,
      isError: true,
    });
  }

  function executeRoll() {
    const formulaValue = state.formula.value.trim();

    if (!formulaValue) {
      handleRollError('Введите формулу', formulaValue);

      return;
    }

    try {
      const { valid, error: validationError } =
        diceRoller.validateWithError(formulaValue);

      if (!valid) {
        handleRollError(
          validationError || 'Некорректная формула',
          formulaValue,
        );

        return;
      }

      const rollResult = diceRoller.roll(formulaValue);
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

      handleRollError(errorMessage, formulaValue);
    }
  }

  const { smaller } = useBreakpoints();
  const isMobile = smaller(Breakpoint.MD);

  const resizeHandle = useTemplateRef<HTMLElement>('resizeHandle');

  const { height: modalHeight } = useResizableHeight({
    handleElement: resizeHandle,
    minHeight: DICE_MODAL_MIN_HEIGHT,
    maxHeightRatio: DICE_MODAL_MAX_HEIGHT_RATIO,
    initialHeight: DICE_MODAL_INITIAL_HEIGHT,
    disabled: isMobile,
  });

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
      class="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm"
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
      class="fixed inset-x-4 top-4 bottom-20 z-50 md:inset-auto md:right-4 md:bottom-20 md:w-96"
    >
      <div
        class="relative flex flex-col overflow-hidden rounded-md border border-default bg-elevated p-4 pt-5 shadow-2xl backdrop-blur-md"
        :style="{
          height: isMobile ? '100%' : `${modalHeight}px`,
        }"
      >
        <div
          v-if="!isMobile"
          ref="resizeHandle"
          class="absolute top-0 right-0 left-0 z-50 flex h-4 cursor-ns-resize items-start justify-center hover:bg-accented/50"
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

        <DiceRollerHistoryList
          v-if="state.history"
          v-model:scroll-element="historyScrollElement"
          :history="state.history.value"
        >
          <template #item="{ entry, formattedDateTime }">
            <DiceRollerHistoryItem
              :key="entry.id"
              :entry="entry"
              :formatted-date-time="formattedDateTime"
            />
          </template>
        </DiceRollerHistoryList>

        <DiceRollerComposer :on-submit="executeRoll">
          <template #help>
            <DiceRollerHelpPopover />
          </template>
        </DiceRollerComposer>
      </div>
    </section>
  </Transition>
</template>
