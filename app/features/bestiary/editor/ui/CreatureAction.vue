<script setup lang="ts">
  import type { CreateAction } from '~bestiary/model';

  import {
    CREATURE_ACTION_ADD_LABELS,
    CREATURE_ACTION_LIST_TITLES,
  } from '../constants';
  import { CreatureActionList } from './action';

  type ActionKey = 'actions' | 'bonusActions' | 'reactions' | 'traits';

  const { name } = defineProps<{
    name: ActionKey;
  }>();

  const model = defineModel<Array<CreateAction>>({ default: () => [] });

  const title = computed(() => CREATURE_ACTION_LIST_TITLES[name]);
  const addLabel = computed(() => CREATURE_ACTION_ADD_LABELS[name]);
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
    />
  </UCard>
</template>
