<script setup lang="ts">
  import type { AbilityRow } from '../../model';

  import { useCharacterSheet } from '../../composables';
  import { ABILITY_SCORE_MAX, ABILITY_SCORE_MIN } from '../../model';
  import SheetPanel from './SheetPanel.vue';

  /**
   * Кнопки быстрой правки ± висят на нижней грани плитки поверх её рамки:
   * мягкая заливка сливалась бы с ней, поэтому у кнопок своя обводка — тем же
   * тоном, каким плитка подсвечивается при наведении.
   */
  const ADJUST_BUTTON_CLASSES =
    'rounded-full border border-primary/60 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100';

  const props = defineProps<{
    abilityRow: AbilityRow;
  }>();

  const emit = defineEmits<{
    roll: [];
    settings: [];
    adjust: [delta: number];
    highlight: [isActive: boolean];
  }>();

  // Быстрая правка ± — действие редактирования: у запертого и у чужого листа
  // кнопки прячутся, а плашка со значением остаётся на прежнем месте.
  const { editControlClass } = useCharacterSheet();

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

  // Наведение подсвечивает навыки этой характеристики. Через `unrefElement`: ref
  // смотрит на компонент рамки, а слушателям нужен её корневой элемент.
  //
  // Без гейта по `(hover: hover)`: он отключал бы подсветку всюду, где браузер
  // не сообщает о наведении — в том числе в эмуляции устройства в DevTools, — а
  // спасал бы лишь от косметики: после тапа подсветка держится до касания в
  // стороне, и всё это время поверх открыта модалка броска.
  const isHovered = useElementHover(() => unrefElement(panelRef));

  // Клавиатура доходит до плитки табом: фокус внутри неё подсвечивает навыки
  // наравне с наведением, иначе связка была бы доступна только мышью.
  const { focused: isFocusWithin } = useFocusWithin(panelRef);

  const isHighlighted = computed(() => isHovered.value || isFocusWithin.value);

  watch(isHighlighted, (highlighted) => emit('highlight', highlighted));

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
          :class="[ADJUST_BUTTON_CLASSES, editControlClass]"
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
          :class="[ADJUST_BUTTON_CLASSES, editControlClass]"
          :aria-label="`Увеличить значение: ${abilityRow.label}`"
          @click.left.exact.prevent.stop="emit('adjust', 1)"
        />
      </div>
    </SheetPanel>
  </UTooltip>
</template>
