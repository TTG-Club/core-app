<script setup lang="ts">
  import type { PlayerBastion } from '../model';

  import { fillTemplate } from '~bastions/model';

  import { DEFENSE_WALL_LABELS } from '../model';
  import { DefenseWallModal } from './ui';

  /**
   * Защитные стены бастиона: сколько блоков построено и строится, окружён ли
   * бастион. В режиме редактирования отсюда заказывают новые блоки.
   */
  const { bastion, editing = false } = defineProps<{
    bastion: PlayerBastion;
    /** Включён режим редактирования бастиона. */
    editing?: boolean;
  }>();

  const emit = defineEmits<{
    updated: [bastion: PlayerBastion];
  }>();

  const isBuildOpen = ref(false);

  const walls = computed(() => bastion.defenseWalls);

  const isBuilding = computed(() => !!walls.value?.building);

  /** Стены строит тот, кто может править запущенный бастион. */
  const canBuild = computed(
    () => editing && bastion.canEdit && bastion.status === 'ACTIVE',
  );

  /** Вне редактирования раздел виден, только когда стены уже есть. */
  const isVisible = computed(
    () =>
      !!walls.value
      && (canBuild.value || walls.value.built > 0 || isBuilding.value),
  );

  const builtText = computed(() =>
    walls.value?.built
      ? fillTemplate(DEFENSE_WALL_LABELS.built, { count: walls.value.built })
      : DEFENSE_WALL_LABELS.none,
  );

  const buildingText = computed(() =>
    walls.value?.building
      ? fillTemplate(DEFENSE_WALL_LABELS.building, {
          count: walls.value.building,
          turn: walls.value.readyOnTurn ?? '—',
        })
      : undefined,
  );
</script>

<template>
  <section
    v-if="isVisible"
    class="flex flex-col gap-2"
  >
    <h2 class="text-base font-semibold text-highlighted">
      {{ DEFENSE_WALL_LABELS.title }}
    </h2>

    <div class="flex flex-wrap items-center gap-3 text-sm">
      <span class="flex items-center gap-1.5 text-toned">
        <UIcon
          name="tabler:wall"
          class="size-4 text-muted"
        />
        {{ builtText }}
      </span>

      <span
        v-if="buildingText"
        class="text-info"
      >
        {{ buildingText }}
      </span>

      <UBadge
        v-if="walls?.enclosed"
        color="success"
        variant="subtle"
        icon="tabler:shield-check"
      >
        {{ DEFENSE_WALL_LABELS.enclosed }}
      </UBadge>

      <UTooltip
        v-if="canBuild"
        :text="isBuilding ? DEFENSE_WALL_LABELS.busy : DEFENSE_WALL_LABELS.hint"
        :ui="{ content: 'max-w-sm h-auto' }"
      >
        <UButton
          icon="tabler:wall"
          size="sm"
          variant="subtle"
          :disabled="isBuilding"
          @click.left.exact.prevent="isBuildOpen = true"
        >
          {{ DEFENSE_WALL_LABELS.build }}
        </UButton>
      </UTooltip>
    </div>

    <DefenseWallModal
      v-if="canBuild"
      v-model:open="isBuildOpen"
      :bastion
      @updated="emit('updated', $event)"
    />
  </section>
</template>
