<script setup lang="ts">
  import type { ActiveEffect, EffectOrigin } from '../model';

  import {
    ACTIVE_EFFECT_LABELS,
    createEmptyActiveEffect,
    DEFAULT_EFFECT_ICON,
  } from '../model';
  import ActiveEffectItem from './ui/ActiveEffectItem.vue';

  // Источник задаёт редактор-хозяин: он же и знает, чем эффект выдан.
  const { origin = 'spell' } = defineProps<{ origin?: EffectOrigin }>();

  const model = defineModel<Array<ActiveEffect>>({ default: () => [] });

  /**
   * Раскрытые эффекты — по их индексу. Свой список, а не аккордеон: кнопка
   * удаления обязана лежать РЯДОМ с раскрывающим триггером, а не внутри него,
   * иначе удалить эффект можно только развернув его.
   */
  const expanded = ref<Set<number>>(new Set());

  /** Индекс эффекта, удаление которого ждёт подтверждения. */
  const pendingRemoval = ref<number | undefined>(undefined);

  const isRemovalOpen = computed({
    get: () => pendingRemoval.value !== undefined,
    set: (open) => {
      if (!open) {
        pendingRemoval.value = undefined;
      }
    },
  });

  function isExpanded(index: number): boolean {
    return expanded.value.has(index);
  }

  /**
   * Значок кнопки свёртки. Функцией, а не вычисляемым свойством: состояние
   * своё у каждой строки списка.
   *
   * @param index позиция эффекта в списке.
   * @returns имя значка.
   */
  function getToggleIcon(index: number): string {
    return isExpanded(index) ? 'tabler:chevron-up' : 'tabler:chevron-down';
  }

  /**
   * Подпись кнопки свёртки для скринридера.
   *
   * @param index позиция эффекта в списке.
   * @returns подпись действия.
   */
  function getToggleLabel(index: number): string {
    return isExpanded(index)
      ? ACTIVE_EFFECT_LABELS.collapse
      : ACTIVE_EFFECT_LABELS.expand;
  }

  function toggle(index: number) {
    const next = new Set(expanded.value);

    if (!next.delete(index)) {
      next.add(index);
    }

    expanded.value = next;
  }

  function addEffect() {
    // Индекс считается ДО записи: `model.value` после присваивания ещё отдаёт
    // прежний массив — проп доедет только следующим тиком.
    const addedIndex = model.value.length;

    model.value = [...model.value, createEmptyActiveEffect(origin)];

    // Новый эффект сразу раскрыт: его всё равно тут же настраивают.
    expanded.value = new Set([...expanded.value, addedIndex]);
  }

  function askRemoveEffect(index: number) {
    pendingRemoval.value = index;
  }

  function confirmRemoveEffect() {
    const index = pendingRemoval.value;

    pendingRemoval.value = undefined;

    if (index === undefined) {
      return;
    }

    model.value = model.value.filter((_, position) => position !== index);

    // Раскрытые сдвигаются вместе со списком: иначе после удаления
    // развернулся бы соседний эффект.
    expanded.value = new Set(
      [...expanded.value]
        .filter((position) => position !== index)
        .map((position) => (position > index ? position - 1 : position)),
    );
  }

  function updateEffect(index: number, value: ActiveEffect) {
    model.value = model.value.map((effect, position) =>
      position === index ? value : effect,
    );
  }
</script>

<template>
  <UCard variant="subtle">
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <div class="flex min-w-0 flex-col">
          <h2 class="truncate text-base text-highlighted">
            {{ ACTIVE_EFFECT_LABELS.title }}
          </h2>

          <span class="text-xs text-muted">
            {{ ACTIVE_EFFECT_LABELS.subtitle }}
          </span>
        </div>

        <UButton
          icon="tabler:plus"
          size="sm"
          variant="subtle"
          @click.left.exact.prevent="addEffect"
        >
          {{ ACTIVE_EFFECT_LABELS.add }}
        </UButton>
      </div>
    </template>

    <p
      v-if="!model.length"
      class="rounded-lg border border-dashed border-default p-6 text-center text-sm text-dimmed italic"
    >
      {{ ACTIVE_EFFECT_LABELS.empty }}
    </p>

    <div
      v-else
      class="flex flex-col gap-3"
    >
      <div
        v-for="(effect, index) in model"
        :key="index"
        class="rounded-lg border border-default bg-elevated/20"
      >
        <div class="flex items-center gap-2 px-3 py-2">
          <UIcon
            :name="effect.icon || DEFAULT_EFFECT_ICON"
            class="size-5 shrink-0 text-primary"
          />

          <span class="min-w-0 flex-1 truncate text-base">
            {{ effect.name || ACTIVE_EFFECT_LABELS.unnamed }}
          </span>

          <UButton
            icon="tabler:trash"
            color="error"
            variant="ghost"
            size="xs"
            :aria-label="ACTIVE_EFFECT_LABELS.remove"
            @click.left.exact.prevent="askRemoveEffect(index)"
          />

          <UButton
            :icon="getToggleIcon(index)"
            color="neutral"
            variant="ghost"
            size="xs"
            :aria-label="getToggleLabel(index)"
            @click.left.exact.prevent="toggle(index)"
          />
        </div>

        <div
          v-if="isExpanded(index)"
          class="border-t border-default p-3"
        >
          <ActiveEffectItem
            :model-value="effect"
            @update:model-value="updateEffect(index, $event)"
          />
        </div>
      </div>
    </div>

    <UModal
      v-model:open="isRemovalOpen"
      :title="ACTIVE_EFFECT_LABELS.removeConfirmTitle"
      :description="ACTIVE_EFFECT_LABELS.removeConfirmText"
    >
      <template #footer>
        <div class="flex w-full items-center justify-end gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            @click.left.exact.prevent="isRemovalOpen = false"
          >
            {{ ACTIVE_EFFECT_LABELS.removeConfirmCancel }}
          </UButton>

          <UButton
            color="error"
            icon="tabler:trash"
            @click.left.exact.prevent="confirmRemoveEffect"
          >
            {{ ACTIVE_EFFECT_LABELS.removeConfirmApply }}
          </UButton>
        </div>
      </template>
    </UModal>
  </UCard>
</template>
