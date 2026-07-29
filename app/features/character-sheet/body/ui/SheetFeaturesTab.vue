<script setup lang="ts">
  import type { CharacterFeature } from '../../model';

  import { MarkupRender } from '~ui/markup';

  import { useCharacterSheet } from '../../composables';
  import {
    FEATURE_ORIGIN_LABELS,
    getFeaturesAddMenuItems,
    SHEET_FEATURE_ROW_LABELS,
    SHEET_TAB_EMPTY_LABELS,
  } from '../../model';

  const props = defineProps<{
    features: CharacterFeature[];
  }>();

  const emit = defineEmits<{
    'add-feature': [];
    'add-feat': [];
    'edit-feature': [featureId: string];
    'remove-feature': [featureId: string];
  }>();

  // Добавление, правка и удаление особенностей меняют лист: без прав кнопка
  // «Добавить» прячется, а строчные кнопки правки и вовсе не разъезжаются.
  const { canEdit, editControlClass } = useCharacterSheet();

  const addMenuItems = getFeaturesAddMenuItems({
    onAddFeature: () => emit('add-feature'),
    onAddFeat: () => emit('add-feat'),
  });

  const expandedIds = ref(new Set<string>());

  function toggleFeature(featureId: string) {
    if (expandedIds.value.has(featureId)) {
      expandedIds.value.delete(featureId);

      return;
    }

    expandedIds.value.add(featureId);
  }

  function handleEditClick(featureId: string) {
    emit('edit-feature', featureId);
  }

  function handleRemove(featureId: string) {
    emit('remove-feature', featureId);
  }

  /**
   * Цвета бейджа происхождения: вид — зелёный, подвид — синий, класс —
   * основной цвет темы, черта — акцентный.
   */
  const ORIGIN_BADGE_COLORS = {
    species: 'success',
    lineage: 'info',
    class: 'primary',
    feat: 'secondary',
    none: 'neutral',
  } as const;

  /**
   * Колонка кнопок правки строки: пока на строку не навели, она схлопнута в
   * нулевую ширину — место под ней занимает название.
   */
  const ROW_ACTIONS_CLASS =
    'grid shrink-0 grid-cols-[0fr] transition-[grid-template-columns] duration-200';

  /**
   * Наведение (или переход с клавиатуры) раздвигает колонку, и название уступает
   * кнопкам место. На сенсорном экране ховера нет — там кнопки развёрнуты
   * всегда, иначе правку и удаление особенности с телефона не найти.
   */
  const ROW_ACTIONS_REVEAL_CLASS =
    'group-hover/feature:grid-cols-[1fr] focus-within:grid-cols-[1fr] pointer-coarse:grid-cols-[1fr]';

  /**
   * Внутренняя обёртка кнопок: `overflow-hidden` обнуляет минимальную ширину
   * ячейки грида (без него `0fr` не схлопнется под содержимое), а прозрачность
   * убирает кнопки из виду, пока колонка ещё разъезжается.
   */
  const ROW_ACTIONS_INNER_CLASS =
    'flex items-center gap-1 overflow-hidden pl-2 opacity-0 transition-opacity duration-200 group-hover/feature:opacity-100 focus-within:opacity-100 pointer-coarse:opacity-100';

  /**
   * Без прав на правку (лист чужой или заперт замком) колонка не разъезжается
   * вовсе: раздвигать строку ради пустоты на месте спрятанных кнопок незачем.
   */
  const rowActionsClass = computed(() =>
    canEdit.value
      ? `${ROW_ACTIONS_CLASS} ${ROW_ACTIONS_REVEAL_CLASS}`
      : ROW_ACTIONS_CLASS,
  );

  const displayRows = computed(() =>
    props.features.map((feature) => {
      const isExpanded = expandedIds.value.has(feature.id);

      return {
        ...feature,
        isExpanded,
        showBadge: feature.origin !== 'none',
        originLabel: FEATURE_ORIGIN_LABELS[feature.origin],
        badgeColor: ORIGIN_BADGE_COLORS[feature.origin],
        chevronClass: isExpanded ? 'rotate-180' : '',
        hasDescription: feature.description.length > 0,
      };
    }),
  );
</script>

<template>
  <div class="flex flex-col gap-3 pt-2">
    <div class="flex justify-end">
      <UDropdownMenu
        :items="addMenuItems"
        :content="{ align: 'end' }"
      >
        <UButton
          icon="tabler:plus"
          label="Добавить"
          trailing-icon="tabler:chevron-down"
          color="neutral"
          variant="ghost"
          size="sm"
          :class="editControlClass"
        />
      </UDropdownMenu>
    </div>

    <template v-if="displayRows.length">
      <div
        v-for="feature in displayRows"
        :key="feature.id"
        class="flex flex-col rounded-lg border border-default/50 bg-elevated/20 transition-colors hover:border-primary/60"
      >
        <div class="group/feature flex w-full items-center">
          <!-- Раскрытие описания повешено на две настоящие кнопки — название с
            пустым местом строки и стрелку. Растянутого на всю строку
            прозрачного слоя тут нет: кнопки правки стоят между ними, и слой
            пришлось бы перекрывать позиционированием, а поверх него нажатия по
            стрелке уже не доходили. -->
          <button
            type="button"
            class="flex min-w-0 grow cursor-pointer items-center gap-3 rounded-lg py-2 pl-3 text-left focus-visible:outline-2 focus-visible:outline-primary"
            :aria-expanded="feature.isExpanded"
            @click.left.exact.prevent="toggleFeature(feature.id)"
          >
            <UBadge
              v-if="feature.showBadge"
              size="sm"
              :color="feature.badgeColor"
              variant="subtle"
              class="shrink-0"
            >
              {{ feature.originLabel }}
            </UBadge>

            <span
              class="min-w-0 grow truncate text-sm font-medium text-highlighted"
            >
              {{ feature.name }}
            </span>

            <span
              v-if="feature.choice"
              class="shrink-0 text-xs text-primary"
            >
              {{ feature.choice }}
            </span>
          </button>

          <div :class="rowActionsClass">
            <div :class="ROW_ACTIONS_INNER_CLASS">
              <UButton
                icon="tabler:pencil"
                color="neutral"
                variant="ghost"
                size="xs"
                square
                :class="editControlClass"
                :aria-label="`Редактировать особенность: ${feature.name}`"
                @click.left.exact.prevent="handleEditClick(feature.id)"
              />

              <UButton
                icon="tabler:trash"
                color="error"
                variant="ghost"
                size="xs"
                square
                :class="editControlClass"
                :aria-label="`Удалить особенность: ${feature.name}`"
                @click.left.exact.prevent="handleRemove(feature.id)"
              />
            </div>
          </div>

          <!-- Стрелка повторяет действие кнопки с названием, поэтому из обхода
            с клавиатуры и от скринридера скрыта: иначе одна и та же особенность
            занимала бы две остановки табом. -->
          <button
            type="button"
            tabindex="-1"
            aria-hidden="true"
            class="flex shrink-0 cursor-pointer items-center rounded-lg py-2 pr-3 pl-2"
            @click.left.exact.prevent="toggleFeature(feature.id)"
          >
            <UIcon
              name="tabler:chevron-down"
              class="size-4 text-muted transition-transform"
              :class="feature.chevronClass"
            />
          </button>
        </div>

        <div
          v-if="feature.isExpanded"
          class="flex flex-col gap-2 border-t border-default/50 px-3 py-2"
        >
          <div
            v-if="feature.originName"
            class="flex items-baseline gap-1 text-xs"
          >
            <span class="text-muted">
              {{ SHEET_FEATURE_ROW_LABELS.origin }}
            </span>

            <span class="font-medium text-default">
              {{ feature.originName }}
            </span>
          </div>

          <div
            v-if="feature.choice"
            class="flex items-baseline gap-1 text-xs"
          >
            <span class="text-muted">
              {{ SHEET_FEATURE_ROW_LABELS.choice }}
            </span>

            <span class="font-medium text-primary">{{ feature.choice }}</span>
          </div>

          <MarkupRender
            v-if="feature.hasDescription"
            :render-node="feature.description"
            class="text-sm"
          />

          <span
            v-else
            class="text-xs text-dimmed"
          >
            {{ SHEET_FEATURE_ROW_LABELS.emptyDescription }}
          </span>
        </div>
      </div>
    </template>

    <div
      v-else
      class="flex h-64 items-center justify-center rounded-lg border border-dashed border-default text-sm text-dimmed"
    >
      {{ SHEET_TAB_EMPTY_LABELS.features }}
    </div>
  </div>
</template>
