<script setup lang="ts">
  import type { SpellClassPageGroup } from '../model';

  import { PageGrid } from '~ui/page';
  import { SkeletonLinkSmall } from '~ui/skeleton';

  import { SpellLink } from '../link';
  import {
    SPELL_CLASS_GROUP_LOAD_MORE_LABEL,
    SPELL_CLASS_GROUP_RETRY_LABEL,
  } from '../model';

  defineProps<{
    groups: Array<SpellClassPageGroup>;
  }>();

  const emit = defineEmits<{
    'load-more': [classKey: string];
  }>();

  /** Запрашивает следующую страницу выбранного класса. */
  function handleLoadMore(classKey: string): void {
    emit('load-more', classKey);
  }
</script>

<template>
  <div class="flex flex-col gap-6">
    <section
      v-for="classGroup in groups"
      :key="classGroup.key"
      class="flex flex-col gap-4"
    >
      <USeparator>{{ classGroup.label }}</USeparator>

      <PageGrid
        v-if="classGroup.spells.length"
        :columns="3"
      >
        <SpellLink
          v-for="spell in classGroup.spells"
          :key="spell.url"
          :spell="spell"
        />
      </PageGrid>

      <PageGrid
        v-if="classGroup.isLoading && !classGroup.spells.length"
        :columns="3"
      >
        <SkeletonLinkSmall
          v-for="skeletonIndex in 3"
          :key="skeletonIndex"
        />
      </PageGrid>

      <div
        v-if="classGroup.hasNextPage || classGroup.hasError"
        class="flex justify-center"
      >
        <UButton
          variant="soft"
          :loading="classGroup.isLoading"
          @click.left.exact.prevent="handleLoadMore(classGroup.key)"
        >
          {{
            classGroup.hasError
              ? SPELL_CLASS_GROUP_RETRY_LABEL
              : SPELL_CLASS_GROUP_LOAD_MORE_LABEL
          }}
        </UButton>
      </div>
    </section>
  </div>
</template>
