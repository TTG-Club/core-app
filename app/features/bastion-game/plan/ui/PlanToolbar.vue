<script setup lang="ts">
  import type { FurnitureKind, PlanTool } from '../../model';

  import {
    FURNITURE_KIND_ICONS,
    FURNITURE_KIND_LABELS,
    FURNITURE_KINDS,
    PLAN_EDIT_TOOLS,
    PLAN_LABELS,
    PLAN_TOOL_GROUPS,
  } from '../../model';

  /**
   * Инструменты редактора плана группами, отмена и повтор. Кнопка мебели
   * открывает панель с предметами. В режиме просмотра остаётся только «рука»
   * для панорамы.
   */
  const { canEdit, canUndo, canRedo } = defineProps<{
    canEdit: boolean;
    canUndo: boolean;
    canRedo: boolean;
  }>();

  const tool = defineModel<PlanTool>('tool', { required: true });

  const furnitureKind = defineModel<FurnitureKind>('furnitureKind', {
    required: true,
  });

  const isFurnitureOpen = ref(false);

  defineEmits<{
    undo: [];
    redo: [];
  }>();

  const groups = computed(() =>
    PLAN_TOOL_GROUPS.map((group) =>
      group.filter((option) => canEdit || !PLAN_EDIT_TOOLS.has(option.tool)),
    ).filter((group) => group.length > 0),
  );

  /**
   * Оформление кнопки: выбранный инструмент подсвечен.
   *
   * @param option Инструмент.
   * @returns Цвет и вид кнопки.
   */
  function getButtonLook(option: { tool: PlanTool }): {
    color: 'primary' | 'neutral';
    variant: 'solid' | 'ghost';
  } {
    return tool.value === option.tool
      ? { color: 'primary', variant: 'solid' }
      : { color: 'neutral', variant: 'ghost' };
  }

  /**
   * Вид кнопки предмета в панели мебели: выбранный подсвечен.
   *
   * @param kind Предмет.
   * @returns Цвет и вид кнопки.
   */
  function getFurnitureLook(kind: FurnitureKind): {
    color: 'primary' | 'neutral';
    variant: 'soft' | 'ghost';
  } {
    return furnitureKind.value === kind
      ? { color: 'primary', variant: 'soft' }
      : { color: 'neutral', variant: 'ghost' };
  }

  /**
   * Берёт предмет мебели и закрывает панель.
   *
   * @param kind Предмет.
   */
  function chooseFurniture(kind: FurnitureKind): void {
    furnitureKind.value = kind;
    tool.value = 'furniture';
    isFurnitureOpen.value = false;
  }
</script>

<template>
  <div class="flex flex-wrap items-center gap-1">
    <template
      v-for="(group, index) in groups"
      :key="index"
    >
      <USeparator
        v-if="index > 0"
        orientation="vertical"
        class="mx-1 h-6"
      />

      <template
        v-for="option in group"
        :key="option.tool"
      >
        <UPopover
          v-if="option.tool === 'furniture'"
          v-model:open="isFurnitureOpen"
        >
          <UTooltip
            :text="option.label"
            :kbds="[option.key]"
          >
            <UButton
              :icon="option.icon"
              :aria-label="option.label"
              :aria-pressed="tool === option.tool"
              v-bind="getButtonLook(option)"
              size="sm"
              trailing-icon="tabler:chevron-down"
              @click.left.exact="tool = option.tool"
            />
          </UTooltip>

          <template #content>
            <div class="grid grid-cols-2 gap-1 p-1">
              <UButton
                v-for="kind in FURNITURE_KINDS"
                :key="kind"
                :icon="FURNITURE_KIND_ICONS[kind]"
                v-bind="getFurnitureLook(kind)"
                size="sm"
                @click.left.exact.prevent="chooseFurniture(kind)"
              >
                {{ FURNITURE_KIND_LABELS[kind] }}
              </UButton>
            </div>
          </template>
        </UPopover>

        <UTooltip
          v-else
          :text="option.label"
          :kbds="[option.key]"
        >
          <UButton
            :icon="option.icon"
            :aria-label="option.label"
            :aria-pressed="tool === option.tool"
            v-bind="getButtonLook(option)"
            size="sm"
            @click.left.exact.prevent="tool = option.tool"
          />
        </UTooltip>
      </template>
    </template>

    <template v-if="canEdit">
      <USeparator
        orientation="vertical"
        class="mx-1 h-6"
      />

      <UTooltip
        :text="PLAN_LABELS.undo"
        :kbds="['meta', 'z']"
      >
        <UButton
          icon="tabler:arrow-back-up"
          :aria-label="PLAN_LABELS.undo"
          color="neutral"
          variant="ghost"
          size="sm"
          :disabled="!canUndo"
          @click.left.exact.prevent="$emit('undo')"
        />
      </UTooltip>

      <UTooltip
        :text="PLAN_LABELS.redo"
        :kbds="['meta', 'shift', 'z']"
      >
        <UButton
          icon="tabler:arrow-forward-up"
          :aria-label="PLAN_LABELS.redo"
          color="neutral"
          variant="ghost"
          size="sm"
          :disabled="!canRedo"
          @click.left.exact.prevent="$emit('redo')"
        />
      </UTooltip>
    </template>
  </div>
</template>
