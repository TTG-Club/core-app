<script setup lang="ts">
  import { UiDrawer } from '~ui/drawer';
  import { UiResult } from '~ui/result';

  import { CharacterSheetBody, CharacterSheetSkeleton } from '../body';
  import {
    useCharacterSheetAutosave,
    useCharacterSheetLoader,
  } from '../composables';
  import {
    CHARACTER_SHEET_ROUTE,
    CHARACTER_SHEET_SHARED_ROUTE,
    CHARACTER_SHEET_TITLE,
    SHEET_NOT_FOUND_SUBTITLES,
  } from '../model';

  const { characterId = '', shareToken = '' } = defineProps<{
    /** Идентификатор своего листа: загрузка документа и переход на страницу. */
    characterId?: string;

    /**
     * Токен ссылки чужого листа. Задан — лист грузится публичной ручкой и
     * открывается только на просмотр, а «развернуть» ведёт на страницу ссылки.
     */
    shareToken?: string;
  }>();

  const emit = defineEmits<{
    close: [];
  }>();

  const isShared = computed(() => Boolean(shareToken));

  const { status, load } = useCharacterSheetLoader(
    () => shareToken || characterId,
    { shared: isShared },
  );

  // Правок в чужом листе не бывает: автосейв сам молчит в режиме просмотра.
  useCharacterSheetAutosave();

  const pagePath = computed(() =>
    isShared.value
      ? `${CHARACTER_SHEET_SHARED_ROUTE}/${shareToken}`
      : `${CHARACTER_SHEET_ROUTE}/${characterId}`,
  );

  const notFoundSubtitle = computed(() =>
    isShared.value
      ? SHEET_NOT_FOUND_SUBTITLES.shared
      : SHEET_NOT_FOUND_SUBTITLES.own,
  );

  /** Открывает лист на отдельной странице и закрывает drawer. */
  function handleExpand() {
    navigateTo(pagePath.value);
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
      <CharacterSheetSkeleton
        v-if="status === 'pending' || status === 'idle'"
      />

      <UiResult
        v-else-if="status === 'notFound'"
        status="404"
        title="Лист не найден"
        :sub-title="notFoundSubtitle"
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
