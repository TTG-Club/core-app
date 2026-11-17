<script setup lang="ts">
  import { ACTION_LABELS } from '~/shared/consts';
  import { UiDrawer } from '~ui/drawer';

  import { CharacterSheetHost } from '../host';
  import {
    CHARACTER_SHEET_ROUTE,
    CHARACTER_SHEET_SHARED_ROUTE,
    CHARACTER_SHEET_TITLE,
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

  const pagePath = computed(() =>
    shareToken
      ? `${CHARACTER_SHEET_SHARED_ROUTE}/${shareToken}`
      : `${CHARACTER_SHEET_ROUTE}/${characterId}`,
  );

  // Дровер переиспользуется: другой лист в нём — новый хост
  const hostKey = computed(() => shareToken || characterId);

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
      <!-- Крестик даёт шапка дровера, поэтому свой у листа скрыт -->
      <CharacterSheetHost
        :key="hostKey"
        :character-id
        :share-token
        :can-close="false"
        @close="emit('close')"
        @expand="handleExpand"
      >
        <template #notFoundActions>
          <UButton @click.left.exact.prevent="emit('close')">
            {{ ACTION_LABELS.close }}
          </UButton>
        </template>
      </CharacterSheetHost>
    </template>
  </UiDrawer>
</template>
