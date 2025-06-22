<script setup lang="ts">
  import { CreatureBody } from '~bestiary/body';
  import { UiDrawer } from '~ui/drawer';

  import type { CreatureDetailResponse } from '~bestiary/types';

  const { creature = undefined } = defineProps<{
    creature?: CreatureDetailResponse;
    isError?: boolean;
    isLoading?: boolean;
  }>();

  defineEmits<{
    (e: 'close'): void;
  }>();

  const urlForCopy = computed(() =>
    creature ? `${getOrigin()}/bestiary/${creature.url}` : undefined,
  );

  const editUrl = computed(() =>
    creature ? `/workshop/bestiary/${creature.url}` : undefined,
  );
</script>

<template>
  <UiDrawer
    :title="creature?.name"
    :source="creature?.source"
    :date-time="creature?.updatedAt"
    :url="urlForCopy"
    :edit-url="editUrl"
    :is-loading
    :is-error
    copy-title
    @close="$emit('close')"
  >
    <CreatureBody
      v-if="creature"
      :creature
    />
  </UiDrawer>
</template>
