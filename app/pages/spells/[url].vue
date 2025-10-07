<script setup lang="ts">
  import { SpellBody } from '~spells/body';
  import { PageActions } from '~ui/page';

  import type { SpellDetailResponse } from '~/shared/types';

  const route = useRoute();

  const { data: spell } = await useAsyncData(`spell-${route.params.url}`, () =>
    $fetch<SpellDetailResponse>(`/api/v2/spells/${route.params.url}`),
  );

  useSeoMeta({
    title: getSeoTitle,
    description: getSeoDescription,
    author: () => (spell.value ? spell.value.source.name.rus : undefined),
    titleTemplate: '%s | Заклинания D&D 5 2024',
  });

  const editUrl = computed(() => `/workshop/spells/${route.params.url}`);

  function getSeoTitle() {
    if (!spell.value) {
      return '';
    }

    return getSlicedString(spell.value.name.rus, 36);
  }

  function getSeoDescription() {
    if (!spell.value) {
      return '';
    }

    const level = spell.value.level
      ? `заклинание ${spell.value.level}-го уровня`
      : 'магический заговор';

    const school = `школы «${spell.value.school}»`;

    return getSlicedString(
      `${spell.value.name.rus} [${spell.value.name.eng}] — ${level} ${school} из D&D 5 (редакция 2024 года).`,
      160,
    );
  }
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="spell?.name.rus"
    :subtitle="spell?.name.eng"
    :source="spell?.source"
    :date-time="spell?.updatedAt"
    copy-text
  >
    <template #actions>
      <PageActions
        :edit-url="editUrl"
        @close="navigateTo({ name: 'spells' })"
      />
    </template>

    <template #default>
      <SpellBody
        v-if="spell"
        :spell
      />

      <template v-else>
        <USkeleton
          v-for="index in 3"
          :key="index"
          :class="`w-1/${index + 1} h-6`"
        />
      </template>
    </template>
  </NuxtLayout>
</template>
