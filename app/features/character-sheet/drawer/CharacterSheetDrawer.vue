<script setup lang="ts">
  import { ACTION_LABELS } from '~/shared/consts';
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
    SHEET_DRAWER_LABELS,
    SHEET_NOT_FOUND_SUBTITLES,
    SHEET_OPEN_ON_PAGE_LABEL,
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
      <UTooltip :text="SHEET_OPEN_ON_PAGE_LABEL">
        <UButton
          icon="tabler:arrow-up-right"
          color="neutral"
          variant="ghost"
          square
          :aria-label="SHEET_OPEN_ON_PAGE_LABEL"
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
        :title="SHEET_DRAWER_LABELS.notFoundTitle"
        :sub-title="notFoundSubtitle"
      >
        <template #extra>
          <UButton @click.left.exact.prevent="emit('close')">
            {{ ACTION_LABELS.close }}
          </UButton>
        </template>
      </UiResult>

      <UiResult
        v-else-if="status === 'error'"
        status="error"
        :title="SHEET_DRAWER_LABELS.errorTitle"
      >
        <template #extra>
          <UButton @click.left.exact.prevent="load">
            {{ ACTION_LABELS.retry }}
          </UButton>
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
