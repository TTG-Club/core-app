<script setup lang="ts">
  import { Role } from '~/shared/types';
  import { CreatureBody } from '~bestiary/body';
  import { PageActions } from '~ui/page';

  import type { CreatureDetailResponse } from '~bestiary/types';

  definePageMeta({
    auth: { roles: [Role.ADMIN] },
  });

  const route = useRoute();

  const { data: creature } = await useAsyncData(
    `bestiary-${route.params.url}`,
    () =>
      $fetch<CreatureDetailResponse>(`/api/v2/bestiary/${route.params.url}`),
  );

  useSeoMeta({
    title: getSeoTitle,
    description: getSeoDescription,
    author: () => (creature.value ? creature.value.source.name.rus : undefined),
    titleTemplate: '%s | Бестиарий D&D 5 2025',
  });

  function getSeoTitle() {
    if (!creature.value) {
      return '';
    }

    return getSlicedString(creature.value.name.rus, 36);
  }

  function getSeoDescription() {
    if (!creature.value) {
      return '';
    }

    return getSlicedString(
      `${creature.value.name.rus} [${creature.value.name.eng}] D&D 5 2024 редакции`,
      160,
    );
  }

  const editUrl = computed(() => `/workshop/bestiary/${route.params.url}`);
</script>

<template>
  <NuxtLayout
    name="detail"
    :title="creature?.name.rus"
    :subtitle="creature?.name.eng"
    :source="creature?.source"
    :date-time="creature?.updatedAt"
    copy-text
  >
    <template #actions>
      <PageActions
        :edit-url="editUrl"
        @close="navigateTo({ name: 'bestiary' })"
      />
    </template>

    <template #default>
      <CreatureBody
        v-if="creature"
        :creature
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
