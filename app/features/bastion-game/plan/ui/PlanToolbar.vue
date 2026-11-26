<script setup lang="ts">
  import type {
    FurnitureKind,
    PlanButtonLook,
    PlanTool,
    PlanToolOption,
    TowerShape,
  } from '../../model';

  import {
    BASIC_FURNITURE_KINDS,
    FURNITURE_KIND_ICONS,
    FURNITURE_KIND_LABELS,
    PLAN_BUTTON_LOOKS,
    PLAN_EDIT_TOOLS,
    PLAN_HISTORY_KBDS,
    PLAN_LABELS,
    PLAN_TOOL_GROUPS,
    PREMIUM_FURNITURE_KINDS,
    TOWER_SHAPE_ICONS,
    TOWER_SHAPE_LABELS,
    TOWER_SHAPES,
  } from '../../model';

  /**
   * Инструменты редактора плана группами, отмена и повтор. Кнопка башни
   * открывает панель с формами башни, кнопка интерьера — с предметами:
   * обычными и по подписке владельца бастиона.
   * В режиме просмотра остаётся только «рука» для панорамы.
   */
  const { canEdit, canUndo, canRedo, premium, disabledTools } = defineProps<{
    canEdit: boolean;
    /** Недоступные сейчас инструменты и почему: причина видна в подсказке. */
    disabledTools: Partial<Record<PlanTool, string>>;
    /** У владельца бастиона подписка: предметы по подписке доступны. */
    premium: boolean;
    canUndo: boolean;
    canRedo: boolean;
  }>();

  const tool = defineModel<PlanTool>('tool', { required: true });

  const furnitureKind = defineModel<FurnitureKind>('furnitureKind', {
    required: true,
  });

  const towerShape = defineModel<TowerShape>('towerShape', { required: true });

  const isFurnitureOpen = ref(false);
  const isTowerOpen = ref(false);

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
   * Оформление кнопки выбора: выбранная подсвечена.
   *
   * @param style Где стоит кнопка: панель инструментов или всплывающая панель.
   * @param isActive Выбрана ли.
   * @returns Цвет и вид кнопки.
   */
  function getLook(style: 'tool' | 'panel', isActive: boolean): PlanButtonLook {
    return PLAN_BUTTON_LOOKS[style][isActive ? 'active' : 'idle'];
  }

  /**
   * Подсказка инструмента: почему он недоступен или его название.
   *
   * @param option Инструмент.
   * @returns Текст подсказки.
   */
  function getToolTooltip(option: PlanToolOption): string {
    return disabledTools[option.tool] ?? option.label;
  }

  /**
   * Клавиша инструмента в подсказке; у недоступного её нет.
   *
   * @param option Инструмент.
   * @returns Клавиши подсказки.
   */
  function getToolKbds(option: PlanToolOption): Array<string> {
    return disabledTools[option.tool] ? [] : [option.key];
  }

  const premiumIcon = computed(() =>
    premium ? 'tabler:sparkles' : 'tabler:lock',
  );

  const premiumText = computed(() =>
    premium ? PLAN_LABELS.premiumFurniture : PLAN_LABELS.premiumFurnitureLocked,
  );

  const premiumItemClass = computed(() => (premium ? '' : 'opacity-50'));

  const undoKbds = [...PLAN_HISTORY_KBDS.undo];
  const redoKbds = [...PLAN_HISTORY_KBDS.redo];

  /**
   * Берёт форму башни и закрывает панель.
   *
   * @param shape Форма.
   */
  function chooseTower(shape: TowerShape): void {
    towerShape.value = shape;
    tool.value = 'tower';
    isTowerOpen.value = false;
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
          v-if="option.tool === 'tower'"
          v-model:open="isTowerOpen"
        >
          <UTooltip
            :text="option.label"
            :kbds="[option.key]"
          >
            <UButton
              :icon="TOWER_SHAPE_ICONS[towerShape]"
              :aria-label="option.label"
              :aria-pressed="tool === option.tool"
              v-bind="getLook('tool', tool === option.tool)"
              size="sm"
              trailing-icon="tabler:chevron-down"
              @click.left.exact="tool = option.tool"
            />
          </UTooltip>

          <template #content>
            <div class="grid grid-cols-2 gap-1 p-1">
              <UButton
                v-for="shape in TOWER_SHAPES"
                :key="shape"
                :icon="TOWER_SHAPE_ICONS[shape]"
                v-bind="getLook('panel', towerShape === shape)"
                size="sm"
                class="text-left"
                @click.left.exact.prevent="chooseTower(shape)"
              >
                {{ TOWER_SHAPE_LABELS[shape] }}
              </UButton>
            </div>
          </template>
        </UPopover>

        <UPopover
          v-else-if="option.tool === 'furniture'"
          v-model:open="isFurnitureOpen"
          :ui="{ content: 'md:max-w-2xl' }"
        >
          <UTooltip
            :text="option.label"
            :kbds="[option.key]"
          >
            <UButton
              :icon="option.icon"
              :aria-label="option.label"
              :aria-pressed="tool === option.tool"
              v-bind="getLook('tool', tool === option.tool)"
              size="sm"
              trailing-icon="tabler:chevron-down"
              @click.left.exact="tool = option.tool"
            />
          </UTooltip>

          <template #content>
            <div
              class="flex max-h-[70vh] w-[32rem] max-w-full flex-col gap-2 overflow-x-hidden overflow-y-auto p-1"
            >
              <div class="grid grid-cols-3 gap-1">
                <UButton
                  v-for="kind in BASIC_FURNITURE_KINDS"
                  :key="kind"
                  :icon="FURNITURE_KIND_ICONS[kind]"
                  v-bind="getLook('panel', furnitureKind === kind)"
                  size="sm"
                  class="text-left"
                  @click.left.exact.prevent="chooseFurniture(kind)"
                >
                  {{ FURNITURE_KIND_LABELS[kind] }}
                </UButton>
              </div>

              <USeparator />

              <div class="flex items-start gap-1 px-2 text-xs text-muted">
                <UIcon
                  :name="premiumIcon"
                  class="mt-px size-3.5 shrink-0"
                />

                <span>{{ premiumText }}</span>
              </div>

              <div class="grid grid-cols-3 gap-1">
                <UButton
                  v-for="kind in PREMIUM_FURNITURE_KINDS"
                  :key="kind"
                  :icon="FURNITURE_KIND_ICONS[kind]"
                  v-bind="getLook('panel', furnitureKind === kind)"
                  size="sm"
                  class="text-left"
                  :class="premiumItemClass"
                  :disabled="!premium"
                  @click.left.exact.prevent="chooseFurniture(kind)"
                >
                  {{ FURNITURE_KIND_LABELS[kind] }}
                </UButton>
              </div>
            </div>
          </template>
        </UPopover>

        <UTooltip
          v-else
          :text="getToolTooltip(option)"
          :kbds="getToolKbds(option)"
        >
          <UButton
            :icon="option.icon"
            :aria-label="option.label"
            :aria-pressed="tool === option.tool"
            v-bind="getLook('tool', tool === option.tool)"
            size="sm"
            :disabled="Boolean(disabledTools[option.tool])"
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
        :kbds="undoKbds"
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
        :kbds="redoKbds"
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
