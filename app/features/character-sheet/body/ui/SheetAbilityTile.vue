<script setup lang="ts">
  import type { AbilityRow } from '../../model';

  import SheetPanel from './SheetPanel.vue';

  defineProps<{
    abilityRow: AbilityRow;
  }>();

  const emit = defineEmits<{
    roll: [];
    settings: [];
  }>();

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

      <UButton
        icon="tabler:settings"
        color="neutral"
        variant="soft"
        size="xs"
        square
        class="absolute -right-2 -bottom-2 z-10 rounded-full opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        :aria-label="`Настроить характеристику: ${abilityRow.label}`"
        @click.left.exact.prevent="emit('settings')"
      />

      <span
        class="pointer-events-none absolute -bottom-2.5 left-1/2 -translate-x-1/2 rounded-full border border-default/50 bg-default px-2 py-0.5 text-xs leading-none font-medium text-muted"
      >
        {{ abilityRow.score }}
      </span>
    </SheetPanel>
  </UTooltip>
</template>
