<script setup lang="ts">
  import type { CreateAction, CreatureActionListKey } from '../../model';

  import { CREATURE_ACTION_EFFECT_CONTEXTS } from '../../model';
  import {
    CREATURE_ACTION_ADD_LABELS,
    CREATURE_ACTION_LIST_TITLES,
  } from '../constants';
  import { CreatureActionList } from './action';

  /** Простые списки записей: у легендарных действий и логова свои блоки. */
  type ActionKey = Exclude<CreatureActionListKey, 'legendary' | 'lair'>;

  const { name } = defineProps<{
    name: ActionKey;
  }>();

  const model = defineModel<Array<CreateAction>>({ default: () => [] });

  const title = computed(() => CREATURE_ACTION_LIST_TITLES[name]);
  const addLabel = computed(() => CREATURE_ACTION_ADD_LABELS[name]);

  /** У черт эффект лежит на самом существе, у действий — ложится на цель. */
  const effectContext = computed(() => CREATURE_ACTION_EFFECT_CONTEXTS[name]);
</script>

<template>
  <UCard
    variant="subtle"
    class="col-span-full"
  >
    <template #header>
      <h2 class="truncate text-base text-highlighted">{{ title }}</h2>
    </template>

    <CreatureActionList
      v-model="model"
      :add-label
      :path="name"
      :effect-context
    />
  </UCard>
</template>
