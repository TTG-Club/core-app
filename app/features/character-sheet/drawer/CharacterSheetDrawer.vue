<script setup lang="ts">
  import { CharacterSheetBody } from '~character-sheet/body';
  import {
    CHARACTER_SHEET_ROUTE,
    CHARACTER_SHEET_TITLE,
  } from '~character-sheet/model';
  import { UiDrawer } from '~ui/drawer';

  const { characterId } = defineProps<{
    /** Идентификатор листа для перехода на отдельную страницу. */
    characterId: string;
  }>();

  const emit = defineEmits<{
    close: [];
  }>();

  /** Открывает лист на отдельной странице и закрывает drawer. */
  function handleExpand() {
    navigateTo(`${CHARACTER_SHEET_ROUTE}/${characterId}`);
    emit('close');
  }
</script>

<template>
  <UiDrawer
    :title="CHARACTER_SHEET_TITLE"
    @close="emit('close')"
  >
    <template #actions>
      <UTooltip text="Открыть на отдельной странице">
        <UButton
          icon="tabler:arrow-up-right"
          color="neutral"
          variant="ghost"
          square
          aria-label="Открыть на отдельной странице"
          @click.left.exact.prevent="handleExpand"
        />
      </UTooltip>
    </template>

    <template #default>
      <CharacterSheetBody
        :can-close="false"
        @close="emit('close')"
        @expand="handleExpand"
      />
    </template>
  </UiDrawer>
</template>
