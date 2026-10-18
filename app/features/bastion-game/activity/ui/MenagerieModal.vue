<script setup lang="ts">
  import type {
    MenagerieCreature,
    PlayerBastion,
    PlayerBastionFacility,
  } from '../../model';

  import { fillTemplate } from '~bastions/model';

  import { useBastionAction } from '../../composables';
  import {
    ACTIVITY_LABELS,
    formatMenagerieSpace,
    removeMenagerieCreature,
    setMenagerieCreatureDefender,
  } from '../../model';

  /**
   * Вольеры зверинца: кто в них живёт и сколько места занято. Игрок персонажа
   * или ведущий выводит существо из защитников или убирает его — например,
   * когда оно погибло, защищая бастион.
   */
  const isOpen = defineModel<boolean>('open', { required: true });

  const { bastion, facility, canManage } = defineProps<{
    bastion: PlayerBastion;
    facility: PlayerBastionFacility;
    /** Можно менять существ, а не только смотреть. */
    canManage: boolean;
  }>();

  const emit = defineEmits<{
    updated: [bastion: PlayerBastion];
  }>();

  const { isRunning, run } = useBastionAction();

  const creatures = computed(() => facility.menagerie?.creatures ?? []);

  const occupiedText = computed(() => {
    const menagerie = facility.menagerie;

    if (!menagerie) {
      return '';
    }

    return fillTemplate(ACTIVITY_LABELS.menagerieOccupied, {
      occupied: formatMenagerieSpace(menagerie.occupied),
      capacity: formatMenagerieSpace(menagerie.capacity),
    });
  });

  /**
   * Подпись существа: размер и, если указан, показатель опасности.
   *
   * @param creature Существо.
   * @returns Подпись.
   */
  function getCreatureTerms(creature: MenagerieCreature): string {
    const values = {
      size: creature.size?.name ?? '',
      challenge: creature.challenge ?? '',
    };

    return creature.challenge
      ? fillTemplate(ACTIVITY_LABELS.menagerieCreatureChallenge, values)
      : fillTemplate(ACTIVITY_LABELS.menagerieCreatureTerms, values);
  }

  /**
   * Применяет изменение существа и отдаёт обновлённый бастион наверх.
   *
   * @param action Запрос к API.
   */
  async function apply(action: () => Promise<PlayerBastion>): Promise<void> {
    const updated = await run(action, ACTIVITY_LABELS.menagerieUpdated);

    if (updated) {
      emit('updated', updated);
    }
  }

  /**
   * Выводит существо из защитников или возвращает.
   *
   * @param creature Существо.
   * @param defender Считать защитником.
   */
  function toggleDefender(
    creature: MenagerieCreature,
    defender: boolean,
  ): Promise<void> {
    return apply(() =>
      setMenagerieCreatureDefender(
        bastion.id,
        facility.id,
        creature.id,
        defender,
      ),
    );
  }

  /**
   * Убирает существо из вольеров.
   *
   * @param creature Существо.
   */
  function remove(creature: MenagerieCreature): Promise<void> {
    return apply(() =>
      removeMenagerieCreature(bastion.id, facility.id, creature.id),
    );
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="ACTIVITY_LABELS.menagerieTitle"
    :description="occupiedText"
  >
    <template #body>
      <p
        v-if="!creatures.length"
        class="text-sm text-muted"
      >
        {{ ACTIVITY_LABELS.menagerieEmpty }}
      </p>

      <ul
        v-else
        class="flex flex-col divide-y divide-default"
      >
        <li
          v-for="creature in creatures"
          :key="creature.id"
          class="flex flex-wrap items-center gap-3 py-2"
        >
          <UIcon
            name="tabler:paw-filled"
            :class="creature.defender ? 'text-info' : 'text-muted'"
            class="size-5 shrink-0"
          />

          <div class="flex min-w-0 flex-1 flex-col">
            <span class="truncate font-medium">{{ creature.name }}</span>

            <span class="text-xs text-muted">
              {{ getCreatureTerms(creature) }}
            </span>
          </div>

          <UTooltip :text="ACTIVITY_LABELS.menagerieDefenderHint">
            <USwitch
              :model-value="creature.defender"
              :label="ACTIVITY_LABELS.menagerieDefender"
              :disabled="!canManage || isRunning"
              @update:model-value="toggleDefender(creature, $event)"
            />
          </UTooltip>

          <UButton
            v-if="canManage"
            icon="tabler:trash"
            size="xs"
            color="error"
            variant="ghost"
            :disabled="isRunning"
            :aria-label="ACTIVITY_LABELS.menagerieRemove"
            @click.left.exact.prevent="remove(creature)"
          />
        </li>
      </ul>
    </template>
  </UModal>
</template>
