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

  // Добавление, правка и удаление особенностей меняют лист: без прав кнопки
  // прячутся, а карточки остаются на прежних местах.
  const { editControlClass } = useCharacterSheet();

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
   * Цвета бейджа происхождения: вид — зелёный, подвид — синий, класс — жёлтый,
   * черта — акцентный.
   */
  const ORIGIN_BADGE_COLORS = {
    species: 'success',
    lineage: 'info',
    class: 'warning',
    feat: 'secondary',
    none: 'neutral',
  } as const;

  /**
   * Кнопки правки строки: с мышью проявляются по наведению на строку, а на
   * сенсорном экране ховера нет — там они видны всегда, иначе правку и удаление
   * особенности с телефона не найти.
   */
  const ROW_ACTIONS_CLASS =
    'relative flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover/feature:opacity-100 focus-within:opacity-100 pointer-coarse:opacity-100';

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
        class="flex flex-col rounded-lg border border-default/50 bg-elevated/20 transition-colors hover:border-warning/60"
      >
        <div
          class="group/feature relative flex w-full items-center gap-2 px-3 py-2"
        >
          <!-- Кнопка-раскрытие растянута на всю строку: разворачивают описание
            и стрелка, и поля строки, и пустое место у названия. Кнопки правки
            идут в разметке после неё и позиционированы — остаются сверху. -->
          <button
            type="button"
            class="absolute inset-0 cursor-pointer rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            :aria-expanded="feature.isExpanded"
            :aria-label="`Особенность: ${feature.name}`"
            @click.left.exact.prevent="toggleFeature(feature.id)"
          />

          <div class="flex min-w-0 grow items-center gap-3">
            <UBadge
              v-if="feature.showBadge"
              size="sm"
              :color="feature.badgeColor"
              variant="subtle"
              class="shrink-0"
            >
              {{ feature.originLabel }}
            </UBadge>

            <span class="grow truncate text-sm font-medium text-highlighted">
              {{ feature.name }}
            </span>
          </div>

          <span
            v-if="feature.choice"
            class="shrink-0 text-xs text-warning"
          >
            {{ feature.choice }}
          </span>

          <div :class="ROW_ACTIONS_CLASS">
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

          <UIcon
            name="tabler:chevron-down"
            class="size-4 shrink-0 text-muted transition-transform"
            :class="feature.chevronClass"
          />
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

            <span class="font-medium text-warning">{{ feature.choice }}</span>
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
