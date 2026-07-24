<script setup lang="ts">
  import { UiDrawer } from '~ui/drawer';
  import { UiResult } from '~ui/result';

  import { CharacterSheetBody } from '../body';
  import {
    useCharacterSheetAutosave,
    useCharacterSheetLoader,
  } from '../composables';
  import { CHARACTER_SHEET_ROUTE, CHARACTER_SHEET_TITLE } from '../model';

  const { characterId } = defineProps<{
    /** Идентификатор листа: загрузка документа и переход на страницу. */
    characterId: string;
  }>();

  const emit = defineEmits<{
    close: [];
  }>();

  const { status, load } = useCharacterSheetLoader(() => characterId);

  useCharacterSheetAutosave();

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
      <div
        v-if="status === 'pending' || status === 'idle'"
        class="flex justify-center py-16"
      >
        <UIcon
          name="tabler:loader-2"
          class="size-8 animate-spin text-muted"
        />
      </div>

      <UiResult
        v-else-if="status === 'notFound'"
        status="404"
        title="Лист не найден"
        sub-title="Возможно, он был удалён или принадлежит другому пользователю"
      >
        <template #extra>
          <UButton @click.left.exact.prevent="emit('close')"> Закрыть </UButton>
        </template>
      </UiResult>

      <UiResult
        v-else-if="status === 'error'"
        status="error"
        title="Не удалось загрузить лист"
      >
        <template #extra>
          <UButton @click.left.exact.prevent="load"> Повторить </UButton>
        </template>
      </UiResult>

      <CharacterSheetBody
        v-else
        :can-close="false"
        @close="emit('close')"
        @expand="handleExpand"
      />
    </template>
  </UiDrawer>
</template>
