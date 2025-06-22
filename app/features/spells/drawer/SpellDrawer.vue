<script setup lang="ts">
  import { SpellBody } from '~spells/body';
  import { DrawerComponent } from '~ui/drawer';

  import type { SpellDetailResponse } from '~/shared/types';

  const { spell = undefined } = defineProps<{
    spell?: SpellDetailResponse;
    isError?: boolean;
    isLoading?: boolean;
  }>();

  defineEmits<{
    (e: 'close'): void;
  }>();

  const urlForCopy = computed(() =>
    spell ? `${getOrigin()}/spells/${spell.url}` : undefined,
  );

  const editUrl = computed(() =>
    spell ? `/workshop/spells/${spell.url}` : undefined,
  );
</script>

<template>
  <DrawerComponent
    :title="spell?.name"
    :source="spell?.source"
    :date-time="spell?.updatedAt"
    :url="urlForCopy"
    :edit-url="editUrl"
    :is-loading
    :is-error
    copy-title
    @close="$emit('close')"
  >
    <SpellBody
      v-if="spell"
      :spell
    />
  </DrawerComponent>
</template>
