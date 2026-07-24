<script setup lang="ts">
  import type { AbilityRow } from '../../model';

  import { ABILITY_SCORE_MAX, ABILITY_SCORE_MIN } from '../../model';
  import SheetPanel from './SheetPanel.vue';

  const props = defineProps<{
    abilityRow: AbilityRow;
  }>();

  const emit = defineEmits<{
    roll: [];
    settings: [];
    adjust: [delta: number];
  }>();

  // Границы диапазона характеристики гасят соответствующую кнопку, чтобы
  // быстрая правка не «упиралась» в клампинг молча.
  const isDecreaseDisabled = computed(
    () => props.abilityRow.score <= ABILITY_SCORE_MIN,
  );

  const isIncreaseDisabled = computed(
    () => props.abilityRow.score >= ABILITY_SCORE_MAX,
  );

  const panelRef = useTemplateRef('panel');

  // Флаг гасит клик, который браузер отправляет после долгого удержания,
  // чтобы вместе с настройками не открывалась модалка броска.
  let isLongPressTriggered = false;

  onLongPress(
    panelRef,
    () => {
      isLongPressTriggered = true;
      emit('settings');
    },
    { delay: 500 },
  );

  function handleRollClick() {
    if (isLongPressTriggered) {
      isLongPressTriggered = false;

      return;
    }

    emit('roll');
  }
</script>

<template>
  <UTooltip :text="abilityRow.label">
    <SheetPanel
      ref="panel"
      :title="abilityRow.shortLabel"
      center-title
      interactive
      class="group w-full"
    >
      <button
        type="button"
        class="flex w-full cursor-pointer items-center justify-center pt-1 pb-2 after:absolute after:inset-0 after:cursor-pointer"
        :aria-label="`Проверка: ${abilityRow.label}`"
        @click.left.exact.prevent="handleRollClick"
      >
        <span class="text-3xl leading-none font-bold text-highlighted">
          {{ abilityRow.formattedModifier }}
        </span>
      </button>

      <!-- Быстрая правка значения прямо на плитке: ± по бокам от значения,
        появляются при наведении. Скрытые кнопки держат место в ряду, поэтому
        плашка со значением остаётся по центру. Модалка (долгое удержание)
        остаётся для точного ввода. -->
      <div
        class="absolute -bottom-2.5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1"
      >
        <UButton
          icon="tabler:minus"
          color="neutral"
          variant="soft"
          size="xs"
          square
          :disabled="isDecreaseDisabled"
          class="rounded-full opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
          :aria-label="`Уменьшить значение: ${abilityRow.label}`"
          @click.left.exact.prevent.stop="emit('adjust', -1)"
        />

        <span
          class="pointer-events-none rounded-full border border-default/50 bg-default px-2 py-0.5 text-xs leading-none font-medium text-muted"
        >
          {{ abilityRow.score }}
        </span>

        <UButton
          icon="tabler:plus"
          color="neutral"
          variant="soft"
          size="xs"
          square
          :disabled="isIncreaseDisabled"
          class="rounded-full opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
          :aria-label="`Увеличить значение: ${abilityRow.label}`"
          @click.left.exact.prevent.stop="emit('adjust', 1)"
        />
      </div>
    </SheetPanel>
  </UTooltip>
</template>
