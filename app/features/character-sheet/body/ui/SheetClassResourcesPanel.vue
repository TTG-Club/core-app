<script setup lang="ts">
  import type { CharacterClassResource } from '../../model';

  import {
    RESOURCE_RECOVERY_ICONS,
    RESOURCE_RECOVERY_LABELS,
    SHEET_EMPTY_LABELS,
  } from '../../model';
  import SheetPanel from './SheetPanel.vue';

  const props = defineProps<{
    resources: CharacterClassResource[];
  }>();

  const emit = defineEmits<{
    adjust: [resourceId: string, delta: number];
    edit: [];
  }>();

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
    props.resources.map((resource) => ({
      ...resource,
      recoveryIcon: RESOURCE_RECOVERY_ICONS[resource.recovery],
      recoveryLabel: RESOURCE_RECOVERY_LABELS[resource.recovery],
      isMinusDisabled: resource.current <= 0,
      isPlusDisabled: resource.current >= resource.max,
    })),
  );
</script>

<template>
  <SheetPanel
    ref="panel"
    title="Ресурсы класса"
    class="group"
  >
    <template #title-actions>
      <button
        type="button"
        class="cursor-pointer rounded-full bg-default p-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        aria-label="Настроить ресурсы класса"
        @click.left.exact.prevent="handleEditClick"
      >
        <UIcon
          name="tabler:settings"
          class="size-3.5 text-muted transition-colors hover:text-warning"
        />
      </button>
    </template>

    <div class="flex flex-col gap-2">
      <template v-if="displayRows.length">
        <div
          v-for="row in displayRows"
          :key="row.id"
          class="flex items-center gap-1.5 rounded bg-default/30 px-2 py-1.5"
          :title="row.name"
        >
          <span
            class="w-9 shrink-0 truncate text-sm font-bold text-highlighted uppercase"
          >
            {{ row.shortLabel }}
          </span>

          <UButton
            icon="tabler:minus"
            color="neutral"
            variant="ghost"
            size="xs"
            square
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
            :disabled="row.isPlusDisabled"
            :aria-label="`Восстановить: ${row.name}`"
            @click.left.exact.prevent="handleAdjust(row.id, 1)"
          />

          <UTooltip
            :text="row.recoveryLabel"
            class="ml-auto"
          >
            <UIcon
              :name="row.recoveryIcon"
              class="size-4 text-muted"
            />
          </UTooltip>
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
