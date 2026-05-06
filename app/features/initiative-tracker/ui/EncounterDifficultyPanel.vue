<script setup lang="ts">
  import type { EncounterDifficulty } from '../model';

  defineProps<{
    difficulty?: EncounterDifficulty | null;
    pending?: boolean;
    readonly?: boolean;
  }>();

  const emit = defineEmits<{
    recalculate: [];
  }>();

  function emitRecalculate(): void {
    emit('recalculate');
  }
</script>

<template>
  <UCard variant="subtle">
    <template #header>
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-lg font-semibold text-highlighted">Сложность</h2>

        <UButton
          v-if="!readonly"
          icon="tabler:refresh"
          size="sm"
          variant="soft"
          color="neutral"
          :loading="pending"
          @click.left.exact.prevent="emitRecalculate"
        >
          Пересчитать
        </UButton>
      </div>
    </template>

    <div
      v-if="difficulty"
      class="grid gap-4"
    >
      <div
        class="flex items-center justify-between gap-3 rounded-lg border border-default bg-default p-3"
      >
        <span class="text-sm text-muted">Текущая</span>

        <span class="text-lg font-bold text-highlighted">
          {{ difficulty.difficulty }}
        </span>
      </div>

      <dl class="grid grid-cols-2 gap-2 text-sm">
        <div class="rounded-md bg-default p-3">
          <dt class="text-muted">Базовый опыт</dt>

          <dd class="font-semibold text-highlighted">
            {{ difficulty.baseExperience }}
          </dd>
        </div>

        <div class="rounded-md bg-default p-3">
          <dt class="text-muted">Скорректированный</dt>

          <dd class="font-semibold text-highlighted">
            {{ difficulty.adjustedExperience }}
          </dd>
        </div>
      </dl>

      <div class="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <div class="rounded-md border border-default p-2">
          <div class="text-muted">Easy</div>

          <div class="font-semibold text-highlighted">
            {{ difficulty.partyThresholds.easy }}
          </div>
        </div>

        <div class="rounded-md border border-default p-2">
          <div class="text-muted">Medium</div>

          <div class="font-semibold text-highlighted">
            {{ difficulty.partyThresholds.medium }}
          </div>
        </div>

        <div class="rounded-md border border-default p-2">
          <div class="text-muted">Hard</div>

          <div class="font-semibold text-highlighted">
            {{ difficulty.partyThresholds.hard }}
          </div>
        </div>

        <div class="rounded-md border border-default p-2">
          <div class="text-muted">Deadly</div>

          <div class="font-semibold text-highlighted">
            {{ difficulty.partyThresholds.deadly }}
          </div>
        </div>
      </div>
    </div>

    <UAlert
      v-else
      icon="tabler:gauge"
      color="neutral"
      variant="soft"
      title="Сложность еще не рассчитана"
    />
  </UCard>
</template>
