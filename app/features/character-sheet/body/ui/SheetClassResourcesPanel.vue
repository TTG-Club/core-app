<script setup lang="ts">
  import type { CharacterClassResource } from '../../model';

  import { useCharacterSheet } from '../../composables';
  import {
    getResourceMax,
    getResourceRecoveryBadges,
    RESOURCES_TITLE,
    SHEET_EMPTY_LABELS,
    SHEET_TITLE_ACTION_CLASS,
    SHEET_TITLE_ACTION_REVEAL_CLASS,
  } from '../../model';
  import SheetPanel from './SheetPanel.vue';

  const props = defineProps<{
    resources: CharacterClassResource[];
  }>();

  const emit = defineEmits<{
    adjust: [resourceId: string, delta: number];
    edit: [];
  }>();

  // Шестерёнка настраивает состав ресурсов (правка листа), а ± тратят и
  // восстанавливают их (игровое действие): запертый лист оставляет ±, чужой —
  // не оставляет ничего.
  const { character, editControlClass, gameControlClass } = useCharacterSheet();

  const panelRef = useTemplateRef('panel');

  // Флаг гасит клик, который браузер отправляет после долгого удержания,
  // чтобы вместе с настройками не срабатывали кнопки трат ресурсов.
  let isLongPressTriggered = false;

  onLongPress(
    panelRef,
    () => {
      isLongPressTriggered = true;
      emit('edit');
    },
    { delay: 500 },
  );

  function handleAdjust(resourceId: string, delta: number) {
    if (isLongPressTriggered) {
      isLongPressTriggered = false;

      return;
    }

    emit('adjust', resourceId, delta);
  }

  function handleEditClick() {
    if (isLongPressTriggered) {
      isLongPressTriggered = false;

      return;
    }

    emit('edit');
  }

  const displayRows = computed(() =>
    props.resources.map((resource) => {
      // Максимум ресурса с правилом считается от листа: записанное число —
      // лишь снимок, и после повышения уровня оно уже не то.
      const max = getResourceMax(character.value, resource);

      return {
        ...resource,
        max,
        recoveryBadges: getResourceRecoveryBadges(resource),
        isMinusDisabled: resource.current <= 0,
        isPlusDisabled: resource.current >= max,
      };
    }),
  );
</script>

<template>
  <SheetPanel
    ref="panel"
    :title="RESOURCES_TITLE"
  >
    <template #title-actions>
      <button
        type="button"
        :class="[
          SHEET_TITLE_ACTION_CLASS,
          SHEET_TITLE_ACTION_REVEAL_CLASS,
          editControlClass,
        ]"
        aria-label="Настроить ресурсы класса"
        @click.left.exact.prevent="handleEditClick"
      >
        <UIcon
          name="tabler:settings"
          class="size-3.5"
        />
      </button>
    </template>

    <div class="flex flex-col gap-2">
      <template v-if="displayRows.length">
        <div
          v-for="row in displayRows"
          :key="row.id"
          class="flex flex-wrap items-center gap-1.5 rounded bg-default/30 px-2 py-1.5"
        >
          <UTooltip :text="row.name">
            <span
              class="w-9 shrink-0 cursor-help truncate text-sm font-bold text-highlighted uppercase"
            >
              {{ row.shortLabel }}
            </span>
          </UTooltip>

          <UButton
            icon="tabler:minus"
            color="neutral"
            variant="ghost"
            size="xs"
            square
            :class="gameControlClass"
            :disabled="row.isMinusDisabled"
            :aria-label="`Потратить: ${row.name}`"
            @click.left.exact.prevent="handleAdjust(row.id, -1)"
          />

          <span class="text-sm text-muted">
            <span class="font-bold text-highlighted">{{ row.current }}</span>
            /{{ row.max }}
          </span>

          <UButton
            icon="tabler:plus"
            color="neutral"
            variant="ghost"
            size="xs"
            square
            :class="gameControlClass"
            :disabled="row.isPlusDisabled"
            :aria-label="`Восстановить: ${row.name}`"
            @click.left.exact.prevent="handleAdjust(row.id, 1)"
          />

          <div class="ml-auto flex items-center gap-1.5">
            <UTooltip
              v-for="badge in row.recoveryBadges"
              :key="badge.rest"
              :text="badge.hint"
            >
              <span class="flex cursor-help items-center gap-0.5 text-muted">
                <UIcon
                  :name="badge.icon"
                  class="size-4 shrink-0"
                />

                <span class="text-[10px] leading-none font-bold">
                  {{ badge.text }}
                </span>
              </span>
            </UTooltip>
          </div>
        </div>
      </template>

      <span
        v-else
        class="pt-1 text-xs text-dimmed italic"
      >
        {{ SHEET_EMPTY_LABELS.classResources }}
      </span>
    </div>
  </SheetPanel>
</template>
