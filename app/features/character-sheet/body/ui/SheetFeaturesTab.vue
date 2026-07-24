<script setup lang="ts">
  import type { CharacterFeature } from '../../model';

  import { MarkupRender } from '~ui/markup';

  import { FEATURE_ORIGIN_LABELS, SHEET_TAB_EMPTY_LABELS } from '../../model';

  const props = defineProps<{
    features: CharacterFeature[];
  }>();

  const emit = defineEmits<{
    'add-feature': [];
    'add-feat': [];
    'edit-feature': [featureId: string];
    'remove-feature': [featureId: string];
  }>();

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

  const displayRows = computed(() =>
    props.features.map((feature) => {
      const isExpanded = expandedIds.value.has(feature.id);

      return {
        ...feature,
        isExpanded,
        showBadge: feature.origin !== 'none',
        originLabel: FEATURE_ORIGIN_LABELS[feature.origin],
        originTooltip:
          feature.originName || FEATURE_ORIGIN_LABELS[feature.origin],
        badgeColor: ORIGIN_BADGE_COLORS[feature.origin],
        chevronClass: isExpanded ? 'rotate-180' : '',
      };
    }),
  );
</script>

<template>
  <div class="flex flex-col gap-3 pt-2">
    <div class="flex justify-end gap-2">
      <UButton
        icon="tabler:award"
        label="Черта"
        color="neutral"
        variant="ghost"
        size="sm"
        aria-label="Добавить черту"
        @click.left.exact.prevent="emit('add-feat')"
      />

      <UButton
        icon="tabler:plus"
        label="Особенность"
        color="neutral"
        variant="ghost"
        size="sm"
        aria-label="Добавить особенность"
        @click.left.exact.prevent="emit('add-feature')"
      />
    </div>

    <template v-if="displayRows.length">
      <div
        v-for="feature in displayRows"
        :key="feature.id"
        class="flex flex-col rounded-lg border border-default/50 bg-elevated/20"
      >
        <div
          class="group/feature relative flex w-full items-center gap-2 px-3 py-2"
        >
          <button
            type="button"
            class="flex min-w-0 grow cursor-pointer items-center gap-3 text-left after:absolute after:inset-0 after:cursor-pointer"
            :aria-expanded="feature.isExpanded"
            :aria-label="`Особенность: ${feature.name}`"
            @click.left.exact.prevent="toggleFeature(feature.id)"
          >
            <UTooltip
              v-if="feature.showBadge"
              :text="feature.originTooltip"
              class="shrink-0"
            >
              <UBadge
                size="sm"
                :color="feature.badgeColor"
                variant="subtle"
              >
                {{ feature.originLabel }}
              </UBadge>
            </UTooltip>

            <span class="grow truncate text-sm font-medium text-highlighted">
              {{ feature.name }}
            </span>
          </button>

          <UButton
            icon="tabler:pencil"
            color="neutral"
            variant="ghost"
            size="xs"
            square
            class="relative z-10 shrink-0 opacity-0 transition-opacity group-hover/feature:opacity-100 focus-visible:opacity-100"
            :aria-label="`Редактировать особенность: ${feature.name}`"
            @click.left.exact.prevent="handleEditClick(feature.id)"
          />

          <UButton
            icon="tabler:trash"
            color="error"
            variant="ghost"
            size="xs"
            square
            class="relative z-10 shrink-0 opacity-0 transition-opacity group-hover/feature:opacity-100 focus-visible:opacity-100"
            :aria-label="`Удалить особенность: ${feature.name}`"
            @click.left.exact.prevent="handleRemove(feature.id)"
          />

          <span
            v-if="feature.choice"
            class="shrink-0 text-xs text-warning"
          >
            {{ feature.choice }}
          </span>

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
            v-if="feature.choice"
            class="flex items-baseline gap-1 text-xs"
          >
            <span class="text-muted">Выбор:</span>

            <span class="font-medium text-warning">{{ feature.choice }}</span>
          </div>

          <MarkupRender
            :render-node="feature.description"
            class="text-sm"
          />
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
