<script setup lang="ts">
  import type { SpellClassPageGroup } from '../model';

  import { PageGrid } from '~ui/page';

  import { SpellLink } from '../link';
  import {
    SPELL_CLASS_GROUP_COLUMNS,
    SPELL_CLASS_GROUP_LOADING_ICON,
    SPELL_CLASS_GROUP_RETRY_LABEL,
  } from '../model';

  const props = defineProps<{
    group: SpellClassPageGroup;
  }>();

  const emit = defineEmits<{
    'load-more': [classKey: string];
  }>();

  const loadMoreElement = useTemplateRef<HTMLElement>('loadMoreElement');
  const isLoadMoreVisible = useElementVisibility(loadMoreElement);

  /** Запрашивает следующую страницу текущей группы. */
  function requestNextPage(): void {
    emit('load-more', props.group.key);
  }

  /** Загружает следующую страницу, когда конец группы попадает в область просмотра. */
  function handleLoadMoreVisibility([
    isVisible,
    hasNextPage,
    isLoading,
    hasError,
  ]: [boolean, boolean, boolean, boolean]): void {
    if (isVisible && hasNextPage && !isLoading && !hasError) {
      requestNextPage();
    }
  }

  watch(
    [
      isLoadMoreVisible,
      () => props.group.hasNextPage,
      () => props.group.isLoading,
      () => props.group.hasError,
    ],
    handleLoadMoreVisibility,
    { immediate: true },
  );
</script>

<template>
  <section class="flex flex-col gap-4">
    <USeparator>{{ group.label }}</USeparator>

    <PageGrid :columns="SPELL_CLASS_GROUP_COLUMNS">
      <SpellLink
        v-for="spell in group.spells"
        :key="spell.url"
        :spell="spell"
      />
    </PageGrid>

    <div
      v-if="group.hasNextPage || group.hasError"
      ref="loadMoreElement"
      class="flex min-h-8 items-center justify-center"
    >
      <UButton
        v-if="group.hasError"
        variant="soft"
        @click.left.exact.prevent="requestNextPage"
      >
        {{ SPELL_CLASS_GROUP_RETRY_LABEL }}
      </UButton>

      <UIcon
        v-else-if="group.isLoading"
        :name="SPELL_CLASS_GROUP_LOADING_ICON"
        class="size-5 animate-spin text-muted"
      />
    </div>
  </section>
</template>
