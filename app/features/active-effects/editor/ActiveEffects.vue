<script setup lang="ts">
  import type { ActiveEffect, EffectOrigin, EffectTarget } from '../model';

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
    defaultTarget = 'self',
  } = defineProps<{
    origin?: EffectOrigin;

    /**
     * На кого нацелен новый эффект. У носителя, который описывает эффектом сам
     * себя, это он сам; у действия существа — цель: укус накладывает Отравление
     * на укушенного, а не на кусающего.
     */
    defaultTarget?: EffectTarget;

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

  function addEffect() {
    // Индекс считается ДО записи: `model.value` после присваивания ещё отдаёт
    // прежний массив — проп доедет только следующим тиком.
    const addedIndex = model.value.length;

    model.value = [
      ...model.value,
      createEmptyActiveEffect(origin, defaultTarget),
    ];

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
        <div
          class="relative flex items-center gap-2 px-3 py-2 transition-colors hover:bg-elevated/40"
        >
          <!-- Нажатие ловит накладка во всю плашку — псевдоэлемент кнопки от
            края до края: попадать в один значок приходилось прицельно. Значок
            свёртки от накладки не поднят, поэтому и он разворачивает эффект.
            Кнопка удаления поднята над ней `relative` -->
          <button
            type="button"
            class="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-md before:absolute before:inset-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            :aria-expanded="isExpanded(index)"
            @click.left.exact.prevent="toggle(index)"
          >
            <UIcon
              :name="effect.icon || DEFAULT_EFFECT_ICON"
              class="size-5 shrink-0 text-primary"
            />

            <span class="min-w-0 flex-1 truncate text-left text-base">
              {{ effect.name || ACTIVE_EFFECT_LABELS.unnamed }}
            </span>
          </button>

          <UButton
            icon="tabler:trash"
            color="error"
            variant="ghost"
            size="xs"
            class="relative shrink-0"
            :aria-label="ACTIVE_EFFECT_LABELS.remove"
            @click.left.exact.prevent="askRemoveEffect(index)"
          />

          <UIcon
            :name="getToggleIcon(index)"
            class="size-4 shrink-0 text-dimmed"
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
