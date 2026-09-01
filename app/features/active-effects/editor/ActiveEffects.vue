<script setup lang="ts">
  import type { ActiveEffect, EffectOrigin } from '../model';

  import { EditorNestedSection } from '~ui/editor';

  import {
    ACTIVE_EFFECT_LABELS,
    createEmptyActiveEffect,
    DEFAULT_EFFECT_ICON,
    EFFECT_ORIGIN,
  } from '../model';
  import ActiveEffectItem from './ui/ActiveEffectItem.vue';

  // Источник задаёт редактор-хозяин: он же и знает, чем эффект выдан.
  const {
    origin = EFFECT_ORIGIN.spell,
    title = ACTIVE_EFFECT_LABELS.title,
    nested = false,
  } = defineProps<{
    origin?: EffectOrigin;

    /**
     * Заголовок блока. Своим его называет редактор, у которого эффекты лежат
     * не на своей вкладке, а внутри записи: у умения класса это «Эффекты
     * умения» — рядом с дарами и ресурсами того же умения.
     */
    title?: string;

    /**
     * Эффекты лежат внутри записи, а не на своей вкладке формы. Тогда блок
     * рисуется разделом на дорожке — как соседние блоки механики: карточка
     * среди них была бы седьмой вложенной рамкой подряд.
     */
    nested?: boolean;
  }>();

  const model = defineModel<Array<ActiveEffect>>({ default: () => [] });

  /**
   * Список эффектов один на оба вида блока — карточку своей вкладки и раздел
   * внутри записи. Через переиспользуемый шаблон, а не копией: разойдясь, копии
   * перестали бы редактировать эффект одинаково.
   */
  const [DefineEffects, ReuseEffects] = createReusableTemplate();

  const { isExpanded, toggle, expand, dropRow, getToggleIcon } =
    useExpandedRows();

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

  /** Без эффектов у карточки остаётся одна шапка: пустое тело места не занимает. */
  const cardUi = computed(() =>
    model.value.length ? {} : { body: 'p-0 sm:p-0' },
  );

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

  function addEffect() {
    // Индекс считается ДО записи: `model.value` после присваивания ещё отдаёт
    // прежний массив — проп доедет только следующим тиком.
    const addedIndex = model.value.length;

    model.value = [...model.value, createEmptyActiveEffect(origin)];

    // Новый эффект сразу раскрыт: его всё равно тут же настраивают.
    expand(addedIndex);
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
    dropRow(index);
  }

  function updateEffect(index: number, value: ActiveEffect) {
    model.value = model.value.map((effect, position) =>
      position === index ? value : effect,
    );
  }
</script>

<template>
  <DefineEffects>
    <div
      v-if="model.length"
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
  </DefineEffects>

  <EditorNestedSection
    v-if="nested"
    :title="title"
    :hint="ACTIVE_EFFECT_LABELS.subtitle"
    :count="model.length"
    :add-label="ACTIVE_EFFECT_LABELS.add"
    :collapsible="false"
    @add="addEffect"
  >
    <ReuseEffects />
  </EditorNestedSection>

  <UCard
    v-else
    variant="subtle"
    :ui="cardUi"
  >
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <div class="flex min-w-0 flex-col">
          <h2 class="truncate text-base text-highlighted">
            {{ title }}
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

    <ReuseEffects />
  </UCard>

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
</template>
